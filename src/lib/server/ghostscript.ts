import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);
const GS_TIMEOUT_MS = 5 * 60 * 1000;

export type CompressLevel = "light" | "balanced" | "extreme";

export const COMPRESS_LEVELS: readonly CompressLevel[] = ["light", "balanced", "extreme"];

export function isCompressLevel(value: unknown): value is CompressLevel {
  return typeof value === "string" && (COMPRESS_LEVELS as readonly string[]).includes(value);
}

/**
 * Ghostscript 的 -dPDFSETTINGS 预设，借鉴 Stirling-PDF 的压缩档。
 * light 用 qpdf（无损，仅结构优化）；balanced/extreme 走 Ghostscript 降采样重编码。
 */
const GS_SETTINGS: Record<Exclude<CompressLevel, "light">, string> = {
  balanced: "/ebook", // 150dpi，屏幕阅读足够清晰
  extreme: "/screen", // 72dpi，体积最小
};

/** 构建 Ghostscript 压缩参数（独立函数便于测试）。 */
export function buildGhostscriptArgs(inputPath: string, outputPath: string, level: Exclude<CompressLevel, "light">): string[] {
  return [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    `-dPDFSETTINGS=${GS_SETTINGS[level]}`,
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];
}

/**
 * 用 Ghostscript 压缩 PDF：对图片降采样并重编码，大幅缩小扫描件/图片型 PDF。
 * 视觉质量随档位下降，文字保持可选中。
 */
export async function compressPdfWithGhostscript(inputBytes: Uint8Array, level: Exclude<CompressLevel, "light">): Promise<Uint8Array> {
  await requireBinary("gs", "PDF 压缩服务正在升级，暂不可用，请稍后再试。");
  return withTempDir("alltools-gscompress-", async (dir) => {
    const inputPath = join(dir, "input.pdf");
    const outputPath = join(dir, "output.pdf");
    await writeFile(inputPath, inputBytes);

    try {
      await run("gs", buildGhostscriptArgs(inputPath, outputPath, level), {
        timeout: GS_TIMEOUT_MS,
        maxBuffer: 2 * 1024 * 1024,
      });
    } catch (error) {
      const captured = error as { killed?: boolean; stderr?: string; stdout?: string };
      if (captured.killed) throw new Error("压缩超时，请尝试更小的文件。");
      const tail = [captured.stderr, captured.stdout].filter(Boolean).join("\n").trim().slice(-300);
      throw new Error(tail ? `压缩出错：${tail}` : "压缩失败，文件可能已加密或损坏。");
    }

    return new Uint8Array(await readFile(outputPath));
  });
}
