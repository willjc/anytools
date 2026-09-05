import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { CHUNK_BYTES, DAY, hashToken, passwordHash, passwordMatches, publicItem, TransferError, transferStore, type TransferItem } from "@/lib/server/transfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const COOKIE = "suishouchuan_session";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" };
let activeBodies = 0;
let activeUploads = 0;
async function bodyBytes(request: Request, max: number) {
  if (Number(request.headers.get("content-length")) > max) throw new TransferError("请求内容过大。", 413);
  if (activeBodies >= 6) throw new TransferError("当前上传较多，请稍后继续。", 503);
  activeBodies++;
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    if (reader) while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > max) { await reader.cancel(); throw new TransferError("请求内容过大。", 413); }
      chunks.push(part.value);
    }
    return Buffer.concat(chunks, size);
  } finally { reader?.releaseLock(); activeBodies--; }
}
async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = JSON.parse((await bodyBytes(request, 2 * 1024 * 1024)).toString());
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch (error) { if (error instanceof TransferError) throw error; throw new TransferError("请求格式不正确。"); }
}
function string(value: unknown) { return typeof value === "string" ? value : ""; }
function json(value: unknown, status = 200) { return NextResponse.json(value, { status, headers: privateHeaders }); }
function setCookie(response: NextResponse, request: NextRequest, name: string, value: string, cookiePath = "/api/transfer", maxAge = 30 * DAY / 1000) {
  response.cookies.set(name, value, { httpOnly: true, sameSite: "lax", secure: request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:", path: cookiePath, maxAge });
}
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") throw new TransferError("请从本站页面进行操作。", 403);
  try {
    if (new URL(origin).host !== request.headers.get("host")) throw new Error();
  } catch { throw new TransferError("请求来源不正确。", 403); }
}
function download(request: NextRequest, item: TransferItem) {
  if (item.kind !== "file") throw new TransferError("这是一条文字，请打开分享页复制。");
  if (item.status !== "ready") throw new TransferError("文件尚未上传完成。", 409);
  const headers = new Headers({ ...privateHeaders, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(item.name).replace(/'/g, "%27")}`, "Accept-Ranges": "bytes", "Content-Security-Policy": "sandbox; default-src 'none'" });
  let start = 0, end = item.size - 1;
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { ...privateHeaders, "Content-Range": `bytes */${item.size}` } });
    if (match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; }
    else start = Math.max(0, item.size - Number(match[2]));
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start < 0 || start >= item.size) return new Response(null, { status: 416, headers: { ...privateHeaders, "Content-Range": `bytes */${item.size}` } });
    headers.set("Content-Range", `bytes ${start}-${end}/${item.size}`);
  }
  headers.set("Content-Length", String(Math.max(0, end - start + 1)));
  if (request.method === "HEAD" || !item.size) return new Response(null, { status: range ? 206 : 200, headers });
  const stream = createReadStream(transferStore().file(item.id), { start, end });
  request.signal.addEventListener("abort", () => stream.destroy(), { once: true });
  return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status: range ? 206 : 200, headers });
}

async function handle(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  let uploadSlot = false;
  try {
    const parts = (await context.params).path ?? [];
    const [action, id, sub] = parts;
    const method = request.method;
    if (action === "items" && ["chunk", "finish"].includes(sub) && ["PUT", "POST"].includes(method)) {
      if (activeUploads >= 4) throw new TransferError("当前上传较多，请稍后继续。", 503);
      activeUploads++;
      uploadSlot = true;
    }
    if (!["GET", "HEAD"].includes(method)) sameOrigin(request);
    const store = transferStore();
    const ip = request.headers.get("x-suishou-client-ip") || "local";
    if (action === "auth" && method === "POST") {
      store.rate(`auth-ip:${ip}`, 60, 15 * 60000);
      const data = await jsonBody(request);
      const username = string(data.username).trim().toLowerCase();
      store.rate(`auth-user:${username}`, 15, 15 * 60000);
      if (data.register === true) { store.rate(`register:${ip}`, 5, 3600000); store.rate("register-global", 30, 3600000); }
      const user = await store.authenticate(username, string(data.password), data.register === true);
      const response = json({ user });
      setCookie(response, request, COOKIE, store.session(user.id));
      return response;
    }
    if (action === "share" && id && /^[a-f0-9]{48}$/.test(id)) {
      const item = store.shared(id);
      const grantName = "suishouchuan_share";
      if (method === "POST" && sub === "unlock") {
        store.rate(`share-unlock:${ip}:${id}`, 10, 15 * 60000);
        const data = await jsonBody(request);
        const code = string(data.code);
        if (code.length > 128 || (item.share_password && !await passwordMatches(code, item.share_password))) throw new TransferError("提取码不正确。", 403);
        const response = json({ ok: true });
        setCookie(response, request, grantName, store.session(null, id, Math.min(Date.now() + DAY, item.share_expires!)), `/api/transfer/share/${id}`, DAY / 1000);
        return response;
      }
      if (!["GET", "HEAD"].includes(method)) throw new TransferError("操作不存在。", 404);
      if (!store.canReadShare(item, request.cookies.get(grantName)?.value)) {
        if (sub === "download") throw new TransferError("请输入提取码。", 403);
        return json({ locked: true });
      }
      if (sub === "download") return download(request, item);
      return json({ item: { id: item.id, kind: item.kind, name: item.name, size: item.size, text: item.text, expires: item.share_expires } });
    }
    const user = store.user(request.cookies.get(COOKIE)?.value);
    if (action === "session" && method === "GET") return json({ user: user ?? null });
    if (!user) throw new TransferError("请先登录随手传。", 401);
    if (action === "logout" && method === "POST") {
      store.db.prepare("DELETE FROM sessions WHERE token=?").run(hashToken(request.cookies.get(COOKIE)!.value));
      const response = json({ ok: true });
      setCookie(response, request, COOKIE, "", "/api/transfer", 0);
      return response;
    }
    if (action === "password" && method === "POST") {
      store.rate(`password:${user.id}`, 10, 15 * 60000);
      const data = await jsonBody(request), password = string(data.password);
      await store.authenticate(user.username, string(data.current), false);
      if (password.length < 8 || password.length > 128) throw new TransferError("新密码长度需为 8–128 位。");
      store.db.prepare("UPDATE users SET password=? WHERE id=?").run(await passwordHash(password), user.id);
      store.db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
      const response = json({ ok: true });
      setCookie(response, request, COOKIE, store.session(user.id));
      return response;
    }
    if (action === "items" && !id && method === "GET") {
      const offset = Number(request.nextUrl.searchParams.get("offset") || 0);
      if (!Number.isSafeInteger(offset) || offset < 0) throw new TransferError("分页参数无效。");
      const rows = store.list(user.id, offset);
      return json({ items: rows.slice(0, 50), more: rows.length > 50 });
    }
    if (action === "text" && method === "POST") {
      store.rate(`create:${user.id}`, 120, 60000);
      const data = await jsonBody(request);
      return json({ item: publicItem(await store.addText(user.id, string(data.name), string(data.text))) });
    }
    if (action === "upload" && !id && method === "POST") {
      store.rate(`create:${user.id}`, 120, 60000);
      const data = await jsonBody(request);
      const item = await store.startUpload(user.id, string(data.name), Number(data.size), string(data.fingerprint));
      return json({ id: item.id, offset: await store.offset(item), chunkBytes: CHUNK_BYTES });
    }
    if (action === "items" && id) {
      const item = store.item(id, user.id);
      if (method === "GET" && !sub) return json({ item: { ...publicItem(item), text: item.text } });
      if (["GET", "HEAD"].includes(method) && sub === "download" && item.kind === "file") return download(request, item);
      if (method === "DELETE" && !sub) { await store.remove(item); return json({ ok: true }); }
      if (method === "PUT" && sub === "chunk") {
        const offset = Number(request.headers.get("x-upload-offset"));
        if (!Number.isSafeInteger(offset) || offset < 0) throw new TransferError("上传偏移无效。");
        return json({ offset: await store.chunk(item, offset, await bodyBytes(request, CHUNK_BYTES)) });
      }
      if (method === "POST" && sub === "finish") return json({ item: publicItem(await store.finish(item)) });
      if (method === "POST" && sub === "share") {
        const data = await jsonBody(request);
        return json({ token: await store.share(item, Number(data.days), string(data.code)) });
      }
      if (method === "DELETE" && sub === "share") {
        store.db.prepare("DELETE FROM sessions WHERE share_token=?").run(item.share_token);
        store.db.prepare("UPDATE items SET share_token=NULL,share_expires=NULL,share_password=NULL WHERE id=? AND user_id=?").run(item.id, user.id);
        return json({ ok: true });
      }
    }
    throw new TransferError("操作不存在。", 404);
  } catch (error) {
    if (error instanceof TransferError) return json({ error: error.message }, error.status);
    console.error("Transfer request failed", error instanceof Error ? error.name : "unknown");
    return json({ error: "操作未完成，请稍后重试。" }, 500);
  } finally { if (uploadSlot) activeUploads--; }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as HEAD };
