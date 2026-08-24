import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);

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
