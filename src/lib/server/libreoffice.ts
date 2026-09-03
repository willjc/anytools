import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);

// The production container runs with a read-only root filesystem; LibreOffice
// insists on a writable HOME for its profile, locks, and fontconfig cache,
// so everything lives under /tmp instead.
async function prepareLibreOfficeHome(): Promise<string> {
  const home = "/tmp/alltools-lo-home";
  await mkdir(join(home, ".cache"), { recursive: true });
  return home;
}

export async function convertPdfToDocx(inputBytes: Uint8Array): Promise<Uint8Array> {
  await requireBinary("soffice", "安装 LibreOffice 后该功能可用。");
  const loHome = await prepareLibreOfficeHome();
  return withTempDir("alltools-docx-", async (dir) => {
    const input = join(dir, "input.pdf");
    const outDir = join(loHome, "out");
    await writeFile(input, inputBytes);
    // Without this infilter LibreOffice imports the PDF into Draw, whose
    // documents cannot be stored through the Writer docx filter.
    await mkdir(outDir, { recursive: true });

    let result;
    try {
      result = await run("soffice", [
        "-env:UserInstallation=file:///tmp/alltools-lo-profile",
        "-env:XDG_CONFIG_HOME=file:///tmp/alltools-lo-home",
        "--headless",
        "--norestore",
        "--infilter=writer_pdf_import",
        "--convert-to", "docx:MS Word 2007 XML",
        "--outdir", outDir,
        input,
      ], {
        env: { ...process.env, HOME: loHome, XDG_CACHE_HOME: join(loHome, ".cache") },
      });
    } catch (error) {
      const captured = error as { stderr?: string; stdout?: string };
      const output = [captured.stderr, captured.stdout].filter(Boolean).join("\n");
      const tail = output.trim().slice(-400);
      throw new Error(tail ? `LibreOffice 转换出错：${tail}` : "LibreOffice 转换进程异常退出。");
    }

    const produced = (await readdir(outDir)).find((name) => name.endsWith(".docx"));
    if (!produced) {
      const listing = (await readdir(dir)).join(", ") || "(empty)";
      const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim().slice(-400);
      throw new Error(`转换未产出文档（目录：${listing}）。LibreOffice 输出：${output || "(无)"}`);
    }
    return new Uint8Array(await readFile(join(outDir, produced)));
  });
}

export async function convertHtmlDocument(
  html: string,
  format: "docx" | "pdf",
): Promise<Uint8Array> {
  await requireBinary("soffice", "安装 LibreOffice 后该功能可用。");
  return withTempDir("alltools-markdown-", async (dir) => {
    const input = join(dir, "input.html");
    const outDir = join(dir, "out");
    const profile = join(dir, "profile");
    await Promise.all([writeFile(input, html, "utf8"), mkdir(outDir), mkdir(profile)]);

    const filter = format === "docx" ? "docx:Office Open XML Text" : "pdf:writer_pdf_Export";
    try {
      await run("soffice", [
        `-env:UserInstallation=${pathToFileURL(profile).href}`,
        "--headless",
        "--norestore",
        "--convert-to", filter,
        "--outdir", outDir,
        input,
      ], { env: { ...process.env, HOME: dir, XDG_CACHE_HOME: join(dir, ".cache") } });
    } catch (error) {
      const captured = error as { stderr?: string; stdout?: string };
      const tail = [captured.stderr, captured.stdout].filter(Boolean).join("\n").trim().slice(-400);
      throw new Error(tail ? `LibreOffice 转换出错：${tail}` : "LibreOffice 转换进程异常退出。");
    }

    const output = join(outDir, `input.${format}`);
    try {
      return new Uint8Array(await readFile(output));
    } catch {
      throw new Error("LibreOffice 未生成转换后的文件。");
    }
  });
}
