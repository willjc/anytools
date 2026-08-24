import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export class CloudToolUnavailableError extends Error {
  readonly hint: string;

  constructor(binary: string, hint: string) {
    super(`服务器尚未安装 ${binary}，该功能暂不可用。`);
    this.name = "CloudToolUnavailableError";
    this.hint = hint;
  }
}

function isMissingBinary(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      ((error as { code?: unknown }).code === "ENOENT" || (error as { code?: unknown }).code === 127),
  );
}

/**
 * A binary counts as installed when the OS can start it; a non-zero exit
 * from the probe itself is fine and means it ran.
 */
export async function requireBinary(name: string, hint: string): Promise<void> {
  try {
    await run(name, ["-version"]);
  } catch (error) {
    if (isMissingBinary(error)) {
      throw new CloudToolUnavailableError(name, hint);
    }
  }
}

export async function withTempDir<T>(prefix: string, handler: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  try {
    return await handler(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
