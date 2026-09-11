import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const DEFAULT_UNAVAILABLE_MESSAGE = "该功能所在的服务正在升级，暂不可用，请稍后再试。";

export class CloudToolUnavailableError extends Error {
  /** 缺失的二进制名，仅供服务端日志与排查使用，不对外展示。 */
  readonly binary: string;

  constructor(binary: string, hint?: string) {
    super(hint ?? DEFAULT_UNAVAILABLE_MESSAGE);
    this.name = "CloudToolUnavailableError";
    this.binary = binary;
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
 *
 * `hint` is the user-facing message shown when the binary is missing. Omit it
 * to fall back to a generic message that never leaks the binary name.
 */
export async function requireBinary(name: string, hint?: string): Promise<void> {
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
