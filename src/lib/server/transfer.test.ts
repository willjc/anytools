import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "@/app/api/transfer/[[...path]]/route";
import { DAY, MAX_FILE_BYTES, TransferStore, passwordMatches, transferStore } from "@/lib/server/transfer";
import { maintain } from "../../../scripts/transfer-maintenance.mjs";

let root: string, store: TransferStore, cookie: string, bob: string, fileId: string, textId: string, share: string;
const bytes = Buffer.from("随手传 arbitrary binary\x00\xff\n<script>alert(1)</script>");
const fingerprint = createHash("sha256").update(bytes).digest("hex");
async function request(method: "GET" | "POST" | "PUT" | "DELETE", route: string, data?: unknown, token = cookie, headers: Record<string, string> = {}) {
  const binary = Buffer.isBuffer(data);
  const req = new NextRequest(`http://localhost/api/transfer/${route}`, { method, headers: { host: "localhost", origin: "http://localhost", ...(token ? { cookie: token } : {}), ...(data !== undefined ? { "Content-Type": binary ? "application/octet-stream" : "application/json" } : {}), ...headers }, body: data === undefined ? undefined : binary ? new Uint8Array(data) : JSON.stringify(data) });
  return ({ GET, POST, PUT, DELETE })[method](req, { params: Promise.resolve({ path: route.split("?")[0].split("/") }) });
}
describe.sequential("随手传 ownership, uploads and sharing", () => {
  beforeAll(async () => { root = await mkdtemp(path.join(tmpdir(), "transfer-test-")); vi.stubEnv("TRANSFER_DATA_DIR", root); store = transferStore(); });
  afterAll(async () => { store.db.close(); vi.unstubAllEnvs(); await rm(root, { recursive: true, force: true }); });
  it("creates accounts with hashed passwords and private sessions", async () => {
    const response = await request("POST", "auth", { username: "alice", password: "test-password-A", register: true }, "");
    expect(response.status).toBe(200);
    cookie = response.headers.get("set-cookie")!.split(";")[0];
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    const user = store.db.prepare("SELECT password FROM users WHERE username='alice'").get() as { password: string };
    expect(user.password).not.toContain("test-password-A");
    expect(await passwordMatches("test-password-A", user.password)).toBe(true);
    const other = await request("POST", "auth", { username: "bob", password: "test-password-B", register: true }, "");
    bob = other.headers.get("set-cookie")!.split(";")[0];
    expect((await request("GET", "items", undefined, "")).status).toBe(401);
    expect((await request("POST", "auth", { username: "alice", password: "wrong-password" }, "")).status).toBe(401);
  });
  it("rejects cross-origin writes and bounded-body violations", async () => {
    expect((await request("POST", "text", { text: "x" }, cookie, { origin: "http://evil.example" })).status).toBe(403);
    expect((await request("POST", "text", { text: "x" }, cookie, { "content-length": "90000000" })).status).toBe(413);
  });
  it("saves text for three years and isolates accounts", async () => {
    const response = await request("POST", "text", { text: "Hello\n另一台电脑", name: "test note" });
    const { item } = await response.json(); textId = item.id;
    expect(item.expires - item.created).toBeGreaterThanOrEqual(1095 * DAY);
    expect((await (await request("GET", `items/${textId}`)).json()).item.text).toBe("Hello\n另一台电脑");
    expect((await (await request("GET", "items", undefined, bob)).json()).items).toHaveLength(0);
    expect((await request("GET", `items/${textId}`, undefined, bob)).status).toBe(404);
    expect((await request("DELETE", `items/${textId}`, undefined, bob)).status).toBe(404);
  });
  it("rejects oversized and path-like file names", async () => {
    expect((await request("POST", "upload", { name: "x", size: MAX_FILE_BYTES + 1, fingerprint })).status).toBe(400);
    expect((await request("POST", "upload", { name: "../x", size: 1, fingerprint })).status).toBe(400);
  });
  it("resumes a file, refuses wrong offsets and verifies the complete hash", async () => {
    const data = { name: "任意文件.dat", size: bytes.length, fingerprint };
    const start = await (await request("POST", "upload", data)).json(); fileId = start.id;
    expect((await request("POST", `items/${fileId}/finish`)).status).toBe(409);
    expect((await request("PUT", `items/${fileId}/chunk`, bytes.subarray(0, 10), cookie, { "x-upload-offset": "1" })).status).toBe(409);
    expect((await request("PUT", `items/${fileId}/chunk`, bytes.subarray(0, 10), cookie, { "x-upload-offset": "0" })).status).toBe(200);
    const resumed = await (await request("POST", "upload", data)).json();
    expect(resumed.id).toBe(fileId); expect(resumed.offset).toBe(10);
    expect((await request("PUT", `items/${fileId}/chunk`, bytes.subarray(10), cookie, { "x-upload-offset": "10" })).status).toBe(200);
    expect((await request("POST", `items/${fileId}/finish`)).status).toBe(200);
    expect(await readFile(store.file(fileId))).toEqual(bytes);
    expect((await request("PUT", `items/${fileId}/chunk`, bytes, cookie, { "x-upload-offset": "0" })).status).toBe(409);
  });
  it("streams original bytes with safe attachment headers and range support", async () => {
    const response = await request("GET", `items/${fileId}/download`);
    expect(response.headers.get("content-disposition")).toContain("attachment;");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
    const range = await request("GET", `items/${fileId}/download`, undefined, cookie, { range: "bytes=3-9" });
    expect(range.status).toBe(206);
    expect(Buffer.from(await range.arrayBuffer())).toEqual(bytes.subarray(3, 10));
    expect((await request("GET", `items/${fileId}/download`, undefined, cookie, { range: "bytes=999-" })).status).toBe(416);
    expect((await request("GET", `items/${fileId}/download`, undefined, bob)).status).toBe(404);
  });
  it("rejects corrupted files and resets their upload for a clean retry", async () => {
    const start = await (await request("POST", "upload", { name: "corrupt.bin", size: bytes.length, fingerprint })).json();
    await request("PUT", `items/${start.id}/chunk`, Buffer.alloc(bytes.length), cookie, { "x-upload-offset": "0" });
    expect((await request("POST", `items/${start.id}/finish`)).status).toBe(409);
    expect(await store.offset(store.item(start.id))).toBe(0);
    await request("DELETE", `items/${start.id}`);
  });
  it("allows anonymous shares and revokes old links when settings change", async () => {
    share = (await (await request("POST", `items/${fileId}/share`, { days: 7 })).json()).token;
    expect((await request("GET", `share/${share}`, undefined, "")).status).toBe(200);
    expect(Buffer.from(await (await request("GET", `share/${share}/download`, undefined, "")).arrayBuffer())).toEqual(bytes);
    const oldShare = share;
    share = (await (await request("POST", `items/${fileId}/share`, { days: 1, code: "AB12" })).json()).token;
    expect((await request("GET", `share/${oldShare}`, undefined, "")).status).toBe(404);
    expect(await (await request("GET", `share/${share}`, undefined, "")).json()).toEqual({ locked: true });
    expect((await request("GET", `share/${share}/download`, undefined, "")).status).toBe(403);
    expect((await request("POST", `share/${share}/unlock`, { code: "no" }, "")).status).toBe(403);
    const unlocked = await request("POST", `share/${share}/unlock`, { code: "AB12" }, "");
    const grant = unlocked.headers.get("set-cookie")!.split(";")[0];
    expect((await request("GET", `share/${share}/download`, undefined, grant)).status).toBe(200);
    expect((await request("DELETE", `items/${fileId}/share`)).status).toBe(200);
    expect((await request("GET", `share/${share}/download`, undefined, grant)).status).toBe(404);
  });
  it("creates a restorable backup and purges expired records", async () => {
    const result = await maintain(root);
    expect(result.files).toBe(1);
    const snapshot = path.join(root, "backups", new Date().toISOString().slice(0, 10));
    expect(await readFile(path.join(snapshot, "files", fileId))).toEqual(bytes);
    const restored = new TransferStore(snapshot);
    expect(restored.db.prepare("SELECT COUNT(*) AS n FROM items").get()).toEqual({ n: 2 });
    expect(restored.db.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
    restored.db.close();
    store.db.prepare("UPDATE items SET expires=0 WHERE id=?").run(textId);
    expect((await request("GET", `items/${textId}`)).status).toBe(404);
    expect((await maintain(root)).expired).toBe(1);
  });
  it("rotates sessions on password changes and enforces login rate limits", async () => {
    const changed = await request("POST", "password", { current: "test-password-A", password: "changed-password" });
    expect(changed.status).toBe(200);
    expect((await (await request("GET", "session")).json()).user).toBe(null);
    cookie = changed.headers.get("set-cookie")!.split(";")[0];
    expect((await (await request("GET", "session")).json()).user.username).toBe("alice");
    for (let n = 0; n < 15; n++) store.rate("test-limit", 15, DAY);
    expect(() => store.rate("test-limit", 15, DAY)).toThrow("尝试过于频繁");
  });
  it("deletes an owned file without deleting its recent backup", async () => {
    expect((await request("DELETE", `items/${fileId}`)).status).toBe(200);
    await expect(readFile(store.file(fileId))).rejects.toMatchObject({ code: "ENOENT" });
    expect((await request("GET", `items/${fileId}`)).status).toBe(404);
  });
});
