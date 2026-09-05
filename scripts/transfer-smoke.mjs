import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";

// Safe synthetic end-to-end fixture. Never use real user files or credentials.
const base = process.argv[2] || "http://localhost:4174";
const large = process.argv.includes("--large");
const username = `qa_${Date.now()}`;
const password = randomBytes(24).toString("hex");
let cookie = "";
let ownerSession = "";
const ids = [];
async function call(route, method = "GET", body, extra = {}) {
  const binary = Buffer.isBuffer(body);
  return fetch(`${base}/api/transfer/${route}`, { method, headers: { origin: base, cookie, ...(body === undefined ? {} : { "content-type": binary ? "application/octet-stream" : "application/json" }), ...extra }, body: body === undefined ? undefined : binary ? body : JSON.stringify(body) });
}
async function ok(route, method = "GET", body, extra) {
  const response = await call(route, method, body, extra);
  assert.equal(response.status, 200, `${route}: ${response.status} ${response.ok ? "" : await response.text()}`);
  return response;
}
try {
  const created = await ok("auth", "POST", { username, password, register: true });
  cookie = created.headers.getSetCookie()[0].split(";")[0];
  ownerSession = cookie;
  const originalCookie = cookie;
  const text = (await (await ok("text", "POST", { name: "随手传上线验证（自动清理）", text: "跨设备文字测试\n123 中文 <script> inert" })).json()).item;
  ids.push(text.id);
  const sharedText = (await (await ok(`items/${text.id}/share`, "POST", { days: 7 })).json()).token;
  cookie = "";
  assert.equal((await (await ok(`share/${sharedText}`)).json()).item.text, "跨设备文字测试\n123 中文 <script> inert");
  assert.equal((await call(`items/${text.id}`)).status, 401);
  cookie = originalCookie;
  const block = randomBytes(8 * 1024 * 1024);
  const chunks = large ? 128 : 3;
  const hash = createHash("sha256");
  for (let index = 0; index < chunks; index++) hash.update(block);
  const fingerprint = hash.digest("hex");
  const payload = { name: "随手传传输校验.bin", size: chunks * block.length, fingerprint };
  let upload = await (await ok("upload", "POST", payload)).json();
  ids.push(upload.id);
  const started = Date.now();
  for (let index = 0; index < chunks; index++) {
    if (index === 1) {
      const login = await ok("auth", "POST", { username, password });
      cookie = login.headers.getSetCookie()[0].split(";")[0];
      ownerSession = cookie;
      const resumed = await (await ok("upload", "POST", payload)).json();
      assert.equal(resumed.id, upload.id);
      assert.equal(resumed.offset, block.length);
      upload = resumed;
    }
    await ok(`items/${upload.id}/chunk`, "PUT", block, { "x-upload-offset": String(index * block.length) });
    if ((index + 1) % 32 === 0) console.log(`Uploaded ${(index + 1) * 8} MiB`);
  }
  await ok(`items/${upload.id}/finish`, "POST");
  const token = (await (await ok(`items/${upload.id}/share`, "POST", { days: 7, code: "TEST26" })).json()).token;
  const ownerCookie = cookie;
  cookie = "";
  assert.deepEqual(await (await ok(`share/${token}`)).json(), { locked: true });
  assert.equal((await call(`share/${token}/download`)).status, 403);
  const unlocked = await ok(`share/${token}/unlock`, "POST", { code: "TEST26" });
  cookie = unlocked.headers.getSetCookie()[0].split(";")[0];
  const download = await ok(`share/${token}/download`);
  let received = 0;
  const receivedHash = createHash("sha256");
  for await (const chunk of download.body) { receivedHash.update(chunk); received += chunk.length; }
  assert.equal(received, payload.size);
  assert.equal(receivedHash.digest("hex"), fingerprint);
  const range = await call(`share/${token}/download`, "GET", undefined, { range: "bytes=123-456" });
  assert.equal(range.status, 206);
  assert.deepEqual(Buffer.from(await range.arrayBuffer()), block.subarray(123, 457));
  const grant = cookie;
  cookie = ownerCookie;
  await ok(`items/${upload.id}/share`, "DELETE");
  cookie = grant;
  assert.equal((await call(`share/${token}/download`)).status, 404);
  cookie = ownerCookie;
  console.log(JSON.stringify({ result: "passed", username, bytes: received, seconds: (Date.now() - started) / 1000, checks: "registration, text, anonymous share, resume after login, full SHA-256 download, passcode, range, revocation" }));
} finally {
  cookie = ownerSession;
  for (const id of ids) {
    const response = await call(`items/${id}`, "DELETE");
    assert.ok(response.status === 200 || response.status === 404, `Failed to remove synthetic item ${id}`);
  }
  console.log(JSON.stringify({ cleanup: "synthetic items deleted", username }));
}
