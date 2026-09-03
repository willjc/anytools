import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";
import { maxUploadBytes } from "@/lib/server/upload";

const run = promisify(execFile);
const API_ROOT = "https://mineru.net/api/v4";

type ApiEnvelope<T> = { code?: number; msg?: string; data?: T };
type BatchResult = {
  file_name?: string;
  state?: string;
  full_zip_url?: string;
  err_msg?: string;
};

export class MineruConfigurationError extends Error {
  constructor() {
    super("服务器尚未配置 MinerU API 密钥。");
    this.name = "MineruConfigurationError";
  }
}

async function mineruJson<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await response.json().catch(() => ({})) as ApiEnvelope<T>;
  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(`MinerU 请求失败：${payload.msg || `HTTP ${response.status}`}`);
  }
  return payload.data;
}

async function extractFullMarkdown(zipBytes: Uint8Array): Promise<Uint8Array> {
  await requireBinary("unzip", "安装 unzip 后该功能可用。");
  return withTempDir("alltools-mineru-", async (dir) => {
    const zipPath = join(dir, "result.zip");
    await writeFile(zipPath, zipBytes);
    const listing = await run("unzip", ["-Z1", zipPath], { maxBuffer: 1024 * 1024 });
    const entry = listing.stdout.split(/\r?\n/).find((name) => /(^|\/)full\.md$/i.test(name));
    if (!entry) throw new Error("MinerU 结果中没有找到 full.md。");
    const output = join(dir, "full.md");
    await run("unzip", ["-p", zipPath, entry], { maxBuffer: maxUploadBytes() }).then(({ stdout }) => writeFile(output, stdout));
    return new Uint8Array(await readFile(output));
  });
}

export async function convertWithMineru(fileName: string, bytes: Uint8Array): Promise<Uint8Array> {
  const token = process.env.MINERU_API_TOKEN?.trim();
  if (!token) throw new MineruConfigurationError();
  fileName = basename(fileName).slice(0, 255);

  const batch = await mineruJson<{ batch_id?: string; file_urls?: string[] }>(`${API_ROOT}/file-urls/batch`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: [{ name: fileName, is_ocr: true }],
      model_version: "vlm",
      enable_formula: true,
      enable_table: true,
    }),
  });
  const batchId = batch.batch_id;
  const uploadUrl = batch.file_urls?.[0];
  if (!batchId || !uploadUrl) throw new Error("MinerU 未返回文件上传地址。");
  const uploadTarget = new URL(uploadUrl);
  if (uploadTarget.protocol !== "https:") throw new Error("MinerU 返回了不安全的上传地址。");

  const uploadResponse = await fetch(uploadTarget, {
    method: "PUT",
    body: Buffer.from(bytes),
    signal: AbortSignal.timeout(120_000),
  });
  if (!uploadResponse.ok) throw new Error(`上传至 MinerU 失败（HTTP ${uploadResponse.status}）。`);

  const deadline = Date.now() + 8 * 60_000;
  let result: BatchResult | undefined;
  while (Date.now() < deadline) {
    const data = await mineruJson<{ extract_result?: BatchResult[] }>(`${API_ROOT}/extract-results/batch/${encodeURIComponent(batchId)}`, token);
    result = data.extract_result?.find((item) => item.file_name === fileName) ?? data.extract_result?.[0];
    if (result?.state === "done") break;
    if (result?.state === "failed") throw new Error(`MinerU 识别失败：${result.err_msg || "未知错误"}`);
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }

  if (result?.state !== "done" || !result.full_zip_url) throw new Error("MinerU 识别超时，请稍后重试。");
  const resultUrl = new URL(result.full_zip_url);
  if (resultUrl.protocol !== "https:") throw new Error("MinerU 返回了不安全的下载地址。");
  const download = await fetch(resultUrl, { signal: AbortSignal.timeout(120_000) });
  if (!download.ok) throw new Error(`下载 MinerU 结果失败（HTTP ${download.status}）。`);
  const declaredSize = Number(download.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > 200 * 1024 * 1024) {
    throw new Error("MinerU 结果超过 200 MB，无法下载。");
  }
  const zipBytes = new Uint8Array(await download.arrayBuffer());
  if (zipBytes.byteLength > 200 * 1024 * 1024) throw new Error("MinerU 结果超过 200 MB，无法下载。");
  return extractFullMarkdown(zipBytes);
}
