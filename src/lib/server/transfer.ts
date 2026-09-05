import { createHash, randomBytes, randomUUID, scrypt as derive, timingSafeEqual } from "node:crypto";
import { createReadStream, mkdirSync } from "node:fs";
import { open, stat, statfs, unlink } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const CHUNK_BYTES = 8 * 1024 * 1024;
export const MAX_FILE_BYTES = 1024 ** 3;
export const DAY = 86400000;
export type TransferItem = { id: string; user_id: string; kind: string; name: string; text: string | null; size: number; status: string; created: number; expires: number; fingerprint: string | null; share_token: string | null; share_expires: number | null; share_password: string | null };
type User = { id: string; username: string; password: string };
export class TransferError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => derive(password, salt, 64, (error, key) => error ? reject(error) : resolve(key)));
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await derivePassword(password, salt)).toString("hex")}`;
}
export async function passwordMatches(password: string, encoded: string) {
  const [salt, hash] = encoded.split(":");
  const key = await derivePassword(password, salt);
  const expected = Buffer.from(hash, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}
export function expiresInThreeYears(now = Date.now()) {
  const date = new Date(now);
  date.setUTCFullYear(date.getUTCFullYear() + 3);
  return date.getTime();
}
export function publicItem(item: TransferItem) {
  return { id: item.id, kind: item.kind, name: item.name, size: item.size, status: item.status, created: item.created, expires: item.expires, shareToken: item.share_expires && item.share_expires > Date.now() ? item.share_token : null, shareExpires: item.share_expires, hasCode: Boolean(item.share_password) };
}

export class TransferStore {
  db: DatabaseSync;
  // ponytail: one app process; use database leases if uploads later span multiple workers.
  busy = new Set<string>();
  constructor(public root: string) {
    mkdirSync(path.join(root, "files"), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path.join(root, "transfer.sqlite"));
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, share_token TEXT, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, name TEXT NOT NULL, text TEXT, size INTEGER NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL, fingerprint TEXT, share_token TEXT UNIQUE, share_expires INTEGER, share_password TEXT);
      CREATE INDEX IF NOT EXISTS items_owner ON items(user_id, created DESC);
      CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
      CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);`);
  }
  file(id: string) {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new TransferError("文件不存在。", 404);
    return path.join(this.root, "files", id);
  }
  rate(key: string, max: number, duration: number) {
    const now = Date.now();
    const row = this.db.prepare(`INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count`).get(hashToken(key), now + duration, now, now) as { count: number };
    if (row.count > max) throw new TransferError("尝试过于频繁，请稍后再试。", 429);
  }
  async authenticate(username: string, password: string, register: boolean) {
    username = username.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,32}$/.test(username)) throw new TransferError("用户名需为 3–32 位字母、数字、下划线或短横线。");
    if (password.length < 8 || password.length > 128) throw new TransferError("密码长度需为 8–128 位。");
    const user = this.db.prepare("SELECT * FROM users WHERE username=?").get(username) as User | undefined;
    if (register) {
      if (user) throw new TransferError("该用户名已被使用。", 409);
      const id = randomUUID();
      const encoded = await passwordHash(password);
      try { this.db.prepare("INSERT INTO users VALUES (?,?,?)").run(id, username, encoded); }
      catch { throw new TransferError("该用户名已被使用。", 409); }
      return { id, username };
    }
    if (!await passwordMatches(password, user?.password ?? `${"0".repeat(32)}:${"0".repeat(128)}`) || !user) throw new TransferError("用户名或密码错误。", 401);
    return { id: user.id, username: user.username };
  }
  session(userId: string | null, shareToken: string | null = null, expires = Date.now() + 30 * DAY) {
    const token = randomBytes(32).toString("hex");
    this.db.prepare("INSERT INTO sessions VALUES (?,?,?,?)").run(hashToken(token), userId, shareToken, expires);
    return token;
  }
  user(token: string | undefined) {
    return token ? this.db.prepare("SELECT users.id,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?").get(hashToken(token), Date.now()) as { id: string; username: string } | undefined : undefined;
  }
  item(id: string, userId?: string) {
    const item = this.db.prepare("SELECT * FROM items WHERE id=? AND expires>?").get(id, Date.now()) as TransferItem | undefined;
    if (!item || (userId !== undefined && item.user_id !== userId)) throw new TransferError("内容不存在或已过期。", 404);
    return item;
  }
  list(userId: string, offset: number) {
    return (this.db.prepare("SELECT id,kind,name,size,status,created,expires,share_token,share_expires,share_password FROM items WHERE user_id=? AND expires>? ORDER BY created DESC,id DESC LIMIT 51 OFFSET ?").all(userId, Date.now(), offset) as TransferItem[]).map(publicItem);
  }
  async room(required: number) {
    const info = await statfs(this.root);
    const reserved = this.db.prepare("SELECT COALESCE(SUM(size),0) AS bytes FROM items WHERE status='uploading'").get() as { bytes: number };
    if (info.bavail * info.bsize - reserved.bytes - required < 5 * 1024 ** 3) throw new TransferError("服务器剩余空间不足，暂时无法接收新内容。", 507);
  }
  async addText(userId: string, name: string, text: string) {
    if (!text.trim() || Buffer.byteLength(text) > 1024 * 1024) throw new TransferError("请输入文字，最多支持 1 MB 文本。");
    await this.room(Buffer.byteLength(text));
    const id = randomUUID(), now = Date.now();
    this.db.prepare("INSERT INTO items(id,user_id,kind,name,text,size,status,created,expires) VALUES (?,?,?,?,?,?,'ready',?,?)").run(id, userId, "text", name.trim().slice(0, 200) || text.trim().split("\n")[0].slice(0, 40), text, Buffer.byteLength(text), now, expiresInThreeYears(now));
    return this.item(id, userId);
  }
  async startUpload(userId: string, name: string, size: number, fingerprint: string) {
    if (!name || name.length > 240 || /[\x00-\x1f/\\]/.test(name) || !Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES || !/^[a-f0-9]{64}$/.test(fingerprint)) throw new TransferError("文件信息无效，单文件最大 1 GB。");
    const existing = this.db.prepare("SELECT * FROM items WHERE user_id=? AND fingerprint=? AND name=? AND size=? AND status='uploading' AND expires>?").get(userId, fingerprint, name, size, Date.now()) as TransferItem | undefined;
    if (existing) return existing;
    await this.room(size);
    const count = this.db.prepare("SELECT COUNT(*) AS n FROM items WHERE user_id=? AND status='uploading'").get(userId) as { n: number };
    if (count.n >= 20) throw new TransferError("有过多未完成上传，请先继续上传或删除它们。");
    const id = randomUUID(), now = Date.now();
    const file = await open(this.file(id), "wx", 0o600);
    await file.close();
    this.db.prepare("INSERT INTO items(id,user_id,kind,name,size,status,created,expires,fingerprint) VALUES (?,?,?,?,?,'uploading',?,?,?)").run(id, userId, "file", name, size, now, now + 7 * DAY, fingerprint);
    return this.item(id, userId);
  }
  async offset(item: TransferItem) { return (await stat(this.file(item.id))).size; }
  async chunk(item: TransferItem, offset: number, bytes: Buffer) {
    if (item.status !== "uploading" || this.busy.has(item.id)) throw new TransferError("该文件正在处理，请稍后重试。", 409);
    this.busy.add(item.id);
    try {
      const current = await this.offset(item);
      if (offset !== current) throw new TransferError("上传进度已变化，请重新选择文件继续上传。", 409);
      if (!bytes.length || bytes.length > CHUNK_BYTES || offset + bytes.length > item.size) throw new TransferError("上传分块大小不正确。");
      const handle = await open(this.file(item.id), "r+");
      try {
        let written = 0;
        while (written < bytes.length) written += (await handle.write(bytes, written, bytes.length - written, offset + written)).bytesWritten;
        await handle.sync();
      } catch (error) { await handle.truncate(current); throw error; }
      finally { await handle.close(); }
      this.db.prepare("UPDATE items SET expires=? WHERE id=?").run(Date.now() + 7 * DAY, item.id);
      return current + bytes.length;
    } finally { this.busy.delete(item.id); }
  }
  async finish(item: TransferItem) {
    if (this.busy.has(item.id)) throw new TransferError("上传仍在进行，请稍后重试。", 409);
    if (item.status === "ready") return item;
    this.busy.add(item.id);
    try {
      if (await this.offset(item) !== item.size) throw new TransferError("文件尚未上传完整。", 409);
      const hash = createHash("sha256");
      for await (const chunk of createReadStream(this.file(item.id))) hash.update(chunk);
      if (hash.digest("hex") !== item.fingerprint) {
        const file = await open(this.file(item.id), "r+");
        await file.truncate(0);
        await file.close();
        throw new TransferError("文件校验失败，请重新选择原文件上传。", 409);
      }
      this.db.prepare("UPDATE items SET status='ready',expires=? WHERE id=? AND status='uploading'").run(expiresInThreeYears(), item.id);
      return this.item(item.id, item.user_id);
    } finally { this.busy.delete(item.id); }
  }
  async remove(item: TransferItem) {
    if (this.busy.has(item.id)) throw new TransferError("文件正在上传，请暂停后再删除。", 409);
    this.busy.add(item.id);
    try {
      if (item.kind === "file") await unlink(this.file(item.id)).catch((e) => { if (e.code !== "ENOENT") throw e; });
      this.db.prepare("DELETE FROM sessions WHERE share_token=?").run(item.share_token);
      this.db.prepare("DELETE FROM items WHERE id=? AND user_id=?").run(item.id, item.user_id);
    } finally { this.busy.delete(item.id); }
  }
  async share(item: TransferItem, days: number, code: string) {
    if (item.status !== "ready" || ![1, 7, 30, 365].includes(days) || (code && !/^[a-zA-Z0-9]{4,16}$/.test(code))) throw new TransferError("请选择有效期限；提取码可留空，或填写 4–16 位字母数字。");
    const encoded = code ? await passwordHash(code) : null;
    const token = randomBytes(24).toString("hex");
    this.db.prepare("DELETE FROM sessions WHERE share_token=?").run(item.share_token);
    this.db.prepare("UPDATE items SET share_token=?,share_expires=?,share_password=? WHERE id=? AND user_id=?").run(token, Math.min(Date.now() + days * DAY, item.expires), encoded, item.id, item.user_id);
    return token;
  }
  shared(token: string) {
    const item = this.db.prepare("SELECT * FROM items WHERE share_token=? AND share_expires>? AND expires>? AND status='ready'").get(token, Date.now(), Date.now()) as TransferItem | undefined;
    if (!item) throw new TransferError("分享已取消、过期或不存在。", 404);
    return item;
  }
  canReadShare(item: TransferItem, grant: string | undefined) {
    return !item.share_password || Boolean(grant && this.db.prepare("SELECT 1 FROM sessions WHERE token=? AND share_token=? AND expires>?").get(hashToken(grant), item.share_token, Date.now()));
  }
}

let store: TransferStore | undefined;
export function transferStore() {
  return store ??= new TransferStore(process.env.TRANSFER_DATA_DIR || path.join(process.cwd(), ".transfer-data"));
}
