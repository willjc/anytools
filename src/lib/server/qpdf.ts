import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);
const QPDF_TIMEOUT_MS = 2 * 60 * 1000;

export type PdfProtectionState = "encrypted" | "notEncrypted";

/** show-encryption 的结果；encrypted 时附带领区信息文本。 */
export type EncryptionCheck = { state: PdfProtectionState; details: string };

export class QpdfInvalidPasswordError extends Error {
  constructor() {
    super("invalid password");
    this.name = "QpdfInvalidPasswordError";
  }
}

export class PdfProtectError extends Error {
  /** wrongPassword：提供了密码但不对；passwordRequired：需要打开密码但未提供；alreadyEncrypted：加密前源文件已有密码 */
  readonly reason: "wrongPassword" | "passwordRequired" | "alreadyEncrypted" | "notEncrypted";

  constructor(reason: PdfProtectError["reason"], message: string) {
    super(message);
    this.name = "PdfProtectError";
    this.reason = reason;
  }
}

export type PdfEncryptionOptions = {
  /** 打开密码；为空表示不设打开密码、仅限制权限 */
  userPassword: string;
  /** 权限密码（所有者密码）；为空时复用打开密码 */
  ownerPassword: string;
  allowPrint: boolean;
  allowCopy: boolean;
  allowModify: boolean;
};

/** 构建 qpdf 256 位 AES 加密参数（位置参数形式，兼容 qpdf 10/11）。 */
export function buildEncryptArgs({ userPassword, ownerPassword, allowPrint, allowCopy, allowModify }: PdfEncryptionOptions): string[] {
  const owner = ownerPassword || userPassword;
  if (!userPassword && !owner) {
    throw new Error("请至少设置一个密码。");
  }
  return [
    "--encrypt",
    userPassword,
    owner,
    "256",
    "--print=" + (allowPrint ? "full" : "none"),
    "--modify=" + (allowModify ? "full" : "none"),
    "--extract=" + (allowCopy ? "y" : "n"),
    "--",
  ];
}

async function runQpdf(args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    return await run("qpdf", args, { timeout: QPDF_TIMEOUT_MS, maxBuffer: 1024 * 1024 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT") {
      const unavailable = new Error("服务器尚未安装 qpdf，该功能暂不可用。");
      unavailable.name = "CloudToolUnavailableError";
      throw unavailable;
    }
    const captured = error as { stderr?: string; stdout?: string };
    const output = `${captured.stderr ?? ""}\n${captured.stdout ?? ""}`;
    if (/invalid password/i.test(output)) {
      throw new QpdfInvalidPasswordError();
    }
    const tail = output.trim().split("\n").slice(-2).join(" ").slice(0, 300);
    throw new Error(tail || "qpdf 处理失败。");
  }
}

async function checkEncryption(inputPath: string, password: string): Promise<EncryptionCheck> {
  const args = ["--show-encryption", ...(password ? ["--password=" + password] : []), inputPath];
  try {
    const { stdout } = await runQpdf(args);
    if (/File is not encrypted/i.test(stdout)) return { state: "notEncrypted", details: stdout.trim() };
    return { state: "encrypted", details: stdout.trim() };
  } catch (error) {
    if (error instanceof QpdfInvalidPasswordError) {
      throw new PdfProtectError(password ? "wrongPassword" : "passwordRequired", password ? "密码不正确，请检查后重试。" : "这个 PDF 设置了打开密码，请输入密码后重试。");
    }
    throw error;
  }
}

async function readTempPdf(dir: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(join(dir, "output.pdf")));
}

export async function compressPdfWithQpdf(inputBytes: Uint8Array): Promise<Uint8Array> {
  await requireBinary("qpdf", "安装 qpdf 后该功能可用。");
  return withTempDir("alltools-compress-", async (dir) => {
    const inputPath = join(dir, "input.pdf");
    const outputPath = join(dir, "output.pdf");

    await writeFile(inputPath, inputBytes);
    // Recompress streams and generate object streams; content is unchanged visually.
    await run("qpdf", [
      "--compress-streams=y",
      "--object-streams=generate",
      "--recompress-flate",
      "--compression-level=9",
      inputPath,
      outputPath,
    ]);
    return new Uint8Array(await readFile(outputPath));
  });
}

/** 给 PDF 加密：可设打开密码，并控制打印 / 复制 / 修改权限（256 位 AES）。 */
export async function encryptPdf(inputBytes: Uint8Array, options: PdfEncryptionOptions): Promise<Uint8Array> {
  await requireBinary("qpdf", "安装 qpdf 后该功能可用。");
  return withTempDir("alltools-protect-", async (dir) => {
    const inputPath = join(dir, "input.pdf");
    await writeFile(inputPath, inputBytes);

    const check = await checkEncryption(inputPath, "");
    if (check.state === "encrypted") {
      throw new PdfProtectError("alreadyEncrypted", "这个 PDF 已经加密，请先解除原有密码再重新加密。");
    }

    const outputPath = join(dir, "output.pdf");
    await runQpdf([...buildEncryptArgs(options), inputPath, outputPath]);
    return readTempPdf(dir);
  });
}

/**
 * 解除 PDF 加密或权限限制。
 * @param password 打开密码；仅权限限制（可打开但禁止编辑）的文件可省略。
 */
export async function decryptPdf(inputBytes: Uint8Array, password = ""): Promise<Uint8Array> {
  await requireBinary("qpdf", "安装 qpdf 后该功能可用。");
  return withTempDir("alltools-unlock-", async (dir) => {
    const inputPath = join(dir, "input.pdf");
    await writeFile(inputPath, inputBytes);

    await checkEncryption(inputPath, password);

    const outputPath = join(dir, "output.pdf");
    try {
      await runQpdf(["--decrypt", ...(password ? ["--password=" + password] : []), inputPath, outputPath]);
    } catch (error) {
      if (error instanceof QpdfInvalidPasswordError) {
        throw new PdfProtectError(
          password ? "wrongPassword" : "passwordRequired",
          password ? "密码不正确，请检查后重试。" : "这个 PDF 设置了打开密码，请输入密码后重试。",
        );
      }
      throw error;
    }
    return readTempPdf(dir);
  });
}
