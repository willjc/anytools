import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export class CloudToolUnavailableError extends Error {
  constructor() {
    super("服务器尚未安装 qpdf，该功能暂不可用。");
    this.name = "CloudToolUnavailableError";
  }
}

async function assertQpdfAvailable() {
  try {
    await run("qpdf", ["--version"]);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ENOENT") {
      throw new CloudToolUnavailableError();
    }
    throw error;
  }
}

export async function compressPdfWithQpdf(inputBytes: Uint8Array): Promise<Uint8Array> {
  await assertQpdfAvailable();

  const workDir = await mkdtemp(join(tmpdir(), "alltools-compress-"));
  const inputPath = join(workDir, "input.pdf");
  const outputPath = join(workDir, "output.pdf");

  try {
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
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
