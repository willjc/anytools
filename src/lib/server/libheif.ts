import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);

export async function convertHeicImage(inputBytes: Uint8Array, toFormat: "jpg" | "png"): Promise<Uint8Array> {
  await requireBinary("heif-convert", "安装 libheif 后该功能可用。");
  return withTempDir("alltools-heif-", async (dir) => {
    const input = join(dir, "input.heic");
    const output = join(dir, `output.${toFormat}`);
    await writeFile(input, inputBytes);
    await run("heif-convert", [input, output]);
    return new Uint8Array(await readFile(output));
  });
}
