/**
 * 电子书格式转换：调用 calibre 的 ebook-convert CLI（GPL-3，二进制子进程调用）。
 * 与 LibreOffice 同样的集成模式，无许可证传染问题。
 */

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);
const EBOOK_TIMEOUT_MS = 5 * 60 * 1000;

import {
  isEbookInputFormat,
  isEbookOutputFormat,
  type EbookInputFormat,
  type EbookOutputFormat,
} from "@/lib/ebook-formats";

export { isEbookInputFormat, isEbookOutputFormat };export function buildEbookConvertArgs({ input, output, format }: { input: string; output: string; format: EbookOutputFormat }): string[] {
  const args = [input, output];
  if (format === "pdf") {
    // 中文电子书默认 A4，避免默认信纸尺寸排版局促
    args.push("--paper-size", "a4", "--pdf-page-margin-left", "54", "--pdf-page-margin-right", "54", "--pdf-page-margin-top", "54", "--pdf-page-margin-bottom", "54");
  }
  return args;
}

export async function convertEbook(inputBytes: Uint8Array, inputExtension: EbookInputFormat, outputFormat: EbookOutputFormat): Promise<Uint8Array> {
  await requireBinary("ebook-convert", "安装 calibre 后该功能可用。");
  return withTempDir("alltools-ebook-", async (dir) => {
    const inputPath = join(dir, `input.${inputExtension}`);
    const outputPath = join(dir, `output.${outputFormat}`);
    await writeFile(inputPath, inputBytes);

    try {
      await run("ebook-convert", buildEbookConvertArgs({ input: inputPath, output: outputPath, format: outputFormat }), {
        timeout: EBOOK_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
      });
    } catch (error) {
      const captured = error as { killed?: boolean; stderr?: string; stdout?: string };
      if (captured.killed) throw new Error("转换超时，请尝试更小的文件。");
      const tail = [captured.stderr, captured.stdout].filter(Boolean).join("\n").trim().slice(-300);
      throw new Error(tail ? `转换出错：${tail}` : "转换失败，文件可能已损坏或格式不受支持。");
    }

    return new Uint8Array(await readFile(outputPath));
  });
}
