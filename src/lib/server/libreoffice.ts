import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);
const LIBREOFFICE_TIMEOUT_MS = 2 * 60 * 1000;
const MAX_LIBREOFFICE_CONVERSIONS = 2;
const ZIP_CENTRAL_HEADER = 0x02014b50;
const ZIP_END_RECORD = 0x06054b50;
const ZIP_LOCAL_HEADER = 0x04034b50;
const MAX_DOCX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
const MAX_DOCX_EXPANSION_RATIO = 100;
let activeLibreOfficeConversions = 0;

type OfficeConversion = {
  input: string | Uint8Array;
  inputExtension: "doc" | "docx" | "html" | "pdf";
  outputExtension: "docx" | "pdf";
  filter: string;
  infilter?: string;
  prefix: string;
};

async function convertWithLibreOffice({
  input,
  inputExtension,
  outputExtension,
  filter,
  infilter,
  prefix,
}: OfficeConversion): Promise<Uint8Array> {
  if (activeLibreOfficeConversions >= MAX_LIBREOFFICE_CONVERSIONS) {
    const error = new Error("服务器正在处理其他文档，请稍后重试。");
    error.name = "CloudToolUnavailableError";
    throw error;
  }

  activeLibreOfficeConversions += 1;
  try {
    await requireBinary("soffice", "安装 LibreOffice 后该功能可用。");
    return await withTempDir(prefix, async (dir) => {
      const inputPath = join(dir, `input.${inputExtension}`);
      const outDir = join(dir, "out");
      const profile = join(dir, "profile");
      await Promise.all([
        writeFile(inputPath, input),
        mkdir(outDir),
        mkdir(profile),
        mkdir(join(dir, ".cache")),
      ]);

      const args = [
        `-env:UserInstallation=${pathToFileURL(profile).href}`,
        "--headless",
        "--norestore",
        ...(infilter ? [`--infilter=${infilter}`] : []),
        "--convert-to",
        filter,
        "--outdir",
        outDir,
        inputPath,
      ];

      try {
        await run("soffice", args, {
          env: { ...process.env, HOME: dir, XDG_CACHE_HOME: join(dir, ".cache") },
          timeout: LIBREOFFICE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024,
        });
      } catch (error) {
        const captured = error as { killed?: boolean; stderr?: string; stdout?: string };
        if (captured.killed) throw new Error("LibreOffice 转换超时，请简化文档后重试。");
        const tail = [captured.stderr, captured.stdout].filter(Boolean).join("\n").trim().slice(-400);
        throw new Error(tail ? `LibreOffice 转换出错：${tail}` : "LibreOffice 转换进程异常退出。");
      }

      try {
        return new Uint8Array(await readFile(join(outDir, `input.${outputExtension}`)));
      } catch {
        throw new Error("LibreOffice 未生成转换后的文件。");
      }
    });
  } finally {
    activeLibreOfficeConversions -= 1;
  }
}

export function isWordDocument(bytes: Uint8Array, extension: "doc" | "docx"): boolean {
  const content = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (extension === "doc") {
    const oleHeader = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    return oleHeader.every((byte, index) => bytes[index] === byte) && content.includes(Buffer.from("WordDocument", "utf16le"));
  }

  const endOffset = content.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (endOffset < Math.max(0, content.length - 65_557) || endOffset + 22 > content.length) return false;

  const entryCount = content.readUInt16LE(endOffset + 10);
  const centralSize = content.readUInt32LE(endOffset + 12);
  const centralOffset = content.readUInt32LE(endOffset + 16);
  if (centralOffset + centralSize > endOffset) return false;

  const names = new Set<string>();
  let totalCompressedBytes = 0;
  let totalUncompressedBytes = 0;
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > endOffset || content.readUInt32LE(offset) !== ZIP_CENTRAL_HEADER) return false;
    const compressedBytes = content.readUInt32LE(offset + 20);
    const uncompressedBytes = content.readUInt32LE(offset + 24);
    if (compressedBytes === 0xffffffff || uncompressedBytes === 0xffffffff) return false;
    totalCompressedBytes += compressedBytes;
    totalUncompressedBytes += uncompressedBytes;
    if (totalUncompressedBytes > MAX_DOCX_UNCOMPRESSED_BYTES) return false;
    const nameLength = content.readUInt16LE(offset + 28);
    const nextOffset = offset + 46 + nameLength + content.readUInt16LE(offset + 30) + content.readUInt16LE(offset + 32);
    const localOffset = content.readUInt32LE(offset + 42);
    if (nextOffset > endOffset || localOffset + 4 > centralOffset || content.readUInt32LE(localOffset) !== ZIP_LOCAL_HEADER) return false;
    names.add(content.subarray(offset + 46, offset + 46 + nameLength).toString("utf8"));
    offset = nextOffset;
  }

  return offset === centralOffset + centralSize
    && content.readUInt32LE(endOffset) === ZIP_END_RECORD
    && totalUncompressedBytes <= Math.max(20 * 1024 * 1024, totalCompressedBytes * MAX_DOCX_EXPANSION_RATIO)
    && names.has("[Content_Types].xml")
    && names.has("word/document.xml");
}

export function convertPdfToDocx(inputBytes: Uint8Array): Promise<Uint8Array> {
  return convertWithLibreOffice({
    input: inputBytes,
    inputExtension: "pdf",
    outputExtension: "docx",
    filter: "docx:MS Word 2007 XML",
    infilter: "writer_pdf_import",
    prefix: "alltools-pdf-to-word-",
  });
}

export function convertWordToPdf(inputBytes: Uint8Array, extension: "doc" | "docx"): Promise<Uint8Array> {
  return convertWithLibreOffice({
    input: inputBytes,
    inputExtension: extension,
    outputExtension: "pdf",
    filter: "pdf:writer_pdf_Export",
    prefix: "alltools-word-to-pdf-",
  });
}

export function convertHtmlDocument(html: string, format: "docx" | "pdf"): Promise<Uint8Array> {
  return convertWithLibreOffice({
    input: html,
    inputExtension: "html",
    outputExtension: format,
    filter: format === "docx" ? "docx:Office Open XML Text" : "pdf:writer_pdf_Export",
    prefix: "alltools-markdown-",
  });
}
