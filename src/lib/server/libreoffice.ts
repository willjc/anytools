import { execFile } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);

export async function convertPdfToDocx(inputBytes: Uint8Array): Promise<Uint8Array> {
  await requireBinary("soffice", "安装 LibreOffice 后该功能可用。");
  return withTempDir("alltools-docx-", async (dir) => {
    const input = join(dir, "input.pdf");
    await writeFile(input, inputBytes);

    let result;
    try {
      result = await run("soffice", [
        "-env:UserInstallation=file:///tmp/alltools-lo-profile",
        "--headless",
        "--norestore",
        "--convert-to", "docx:MS Word 2007 XML",
        "--outdir", dir,
        input,
      ]);
    } catch (error) {
      const captured = error as { stderr?: string; stdout?: string };
      const output = [captured.stderr, captured.stdout].filter(Boolean).join("\n");
      const tail = output.trim().slice(-400);
      throw new Error(tail ? `LibreOffice 转换出错：${tail}` : "LibreOffice 转换进程异常退出。");
    }

    const produced = (await readdir(dir)).find((name) => name.endsWith(".docx"));
    if (!produced) {
      const listing = (await readdir(dir)).join(", ") || "(empty)";
      const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim().slice(-400);
      throw new Error(`转换未产出文档（目录：${listing}）。LibreOffice 输出：${output || "(无)"}`);
    }
    return new Uint8Array(await readFile(join(dir, produced)));
  });
}
