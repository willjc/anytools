import { DatabaseSync, backup } from "node:sqlite";
import { access, mkdir, readdir, rm, link, rename, writeFile, stat, statfs, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const root = process.env.TRANSFER_DATA_DIR || path.resolve(".transfer-data");
const day = 86400000;

export async function maintain(directory = root, now = Date.now()) {
  const database = path.join(directory, "transfer.sqlite");
  try { await access(database); } catch { return { waiting: true }; }
  const db = new DatabaseSync(database);
  db.exec("PRAGMA busy_timeout=5000");
  let expired = 0;
  try {
    for (const item of db.prepare("SELECT id,kind FROM items WHERE expires<=?").all(now)) {
      // Recheck in SQL: a resumed upload may have refreshed its deadline.
      const result = db.prepare("DELETE FROM items WHERE id=? AND expires<=?").run(item.id, now);
      if (result.changes && item.kind === "file" && /^[0-9a-f-]{36}$/.test(item.id)) await unlink(path.join(directory, "files", item.id)).catch((e) => { if (e.code !== "ENOENT") throw e; });
      expired += Number(result.changes);
    }
    db.prepare("DELETE FROM sessions WHERE expires<=? OR (share_token IS NOT NULL AND share_token NOT IN (SELECT share_token FROM items WHERE share_token IS NOT NULL))").run(now);
    db.prepare("DELETE FROM limits WHERE expires<=?").run(now);
    const fileRoot = path.join(directory, "files");
    for (const name of await readdir(fileRoot)) {
      if (!/^[0-9a-f-]{36}$/.test(name) || db.prepare("SELECT 1 FROM items WHERE id=?").get(name)) continue;
      const target = path.join(fileRoot, name);
      if ((await stat(target)).mtimeMs < now - day) await unlink(target);
    }
    const backups = path.join(directory, "backups");
    await mkdir(backups, { recursive: true, mode: 0o700 });
    const date = new Date(now).toISOString().slice(0, 10);
    const destination = path.join(backups, date);
    for (const name of await readdir(backups)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(name) && Date.parse(name) < now - 7 * day) await rm(path.join(backups, name), { recursive: true });
      if (/^\.pending-[0-9a-f-]{36}$/.test(name) && (await stat(path.join(backups, name))).mtimeMs < now - day) await rm(path.join(backups, name), { recursive: true });
    }
    const space = await statfs(directory);
    if (space.bavail * space.bsize < 5 * 1024 ** 3) console.warn("Transfer storage below 5 GiB; new uploads will be refused.");
    try { await access(path.join(destination, "complete.json")); return { expired, backup: "already complete" }; } catch { /* Create today's snapshot. */ }
    const staging = path.join(backups, `.pending-${randomUUID()}`);
    await mkdir(path.join(staging, "files"), { recursive: true, mode: 0o700 });
    try {
      await backup(db, path.join(staging, "transfer.sqlite"));
      const snapshot = new DatabaseSync(path.join(staging, "transfer.sqlite"));
      let files;
      try {
        // Incomplete uploads are temporary and deliberately excluded from backups.
        snapshot.exec("DELETE FROM items WHERE status!='ready'; DELETE FROM sessions; DELETE FROM limits;");
        files = snapshot.prepare("SELECT id FROM items WHERE kind='file'").all();
        if (snapshot.prepare("PRAGMA integrity_check").get().integrity_check !== "ok") throw new Error("Snapshot integrity check failed");
      } finally { snapshot.close(); }
      for (const { id } of files) await link(path.join(directory, "files", id), path.join(staging, "files", id));
      await writeFile(path.join(staging, "complete.json"), JSON.stringify({ completedAt: now, files: files.length }), { mode: 0o600 });
      await rename(staging, destination);
      return { expired, backup: date, files: files.length };
    } catch (error) {
      await rm(staging, { recursive: true, force: true });
      throw error;
    }
  } finally { db.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const run = () => maintain().then((result) => console.log("Transfer maintenance", JSON.stringify(result))).catch((error) => { console.error("Transfer maintenance failed", error.message); if (process.argv.includes("--once")) process.exitCode = 1; });
  await run();
  if (!process.argv.includes("--once")) {
    // One run at a time, including on large file collections.
    const tick = async () => { await run(); setTimeout(tick, 3600000); };
    setTimeout(tick, 3600000);
  }
}
