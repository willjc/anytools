import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  buildAudioConvertArgs,
  buildExtractAudioArgs,
  buildVideoCompressArgs,
  type AudioFormat,
  type VideoHeight,
} from "@/lib/media-options";
import { requireBinary, withTempDir } from "@/lib/server/tool-runtime";

const run = promisify(execFile);

const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000;

async function runFfmpeg(args: string[]): Promise<void> {
  try {
    await run("ffmpeg", args, { timeout: FFMPEG_TIMEOUT_MS, maxBuffer: 1024 * 1024 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT") {
      const unavailable = new Error("服务器尚未安装 ffmpeg，该功能暂不可用。");
      unavailable.name = "CloudToolUnavailableError";
      throw unavailable;
    }
    throw new Error("媒体处理失败：文件可能已损坏或格式不受支持。");
  }
}

async function writeInput(dir: string, inputBytes: Uint8Array): Promise<string> {
  const input = join(dir, "input");
  await writeFile(input, inputBytes);
  return input;
}

export async function compressVideoToMp4(inputBytes: Uint8Array, height: VideoHeight): Promise<Uint8Array> {
  await requireBinary("ffmpeg", "安装 ffmpeg 后该功能可用。");
  return withTempDir("alltools-video-", async (dir) => {
    const input = await writeInput(dir, inputBytes);
    const output = join(dir, "output.mp4");
    await runFfmpeg(buildVideoCompressArgs({ input, output, height }));
    return new Uint8Array(await readFile(output));
  });
}

export async function extractAudioToMp3(inputBytes: Uint8Array): Promise<Uint8Array> {
  await requireBinary("ffmpeg", "安装 ffmpeg 后该功能可用。");
  return withTempDir("alltools-audio-", async (dir) => {
    const input = await writeInput(dir, inputBytes);
    const output = join(dir, "output.mp3");
    await runFfmpeg(buildExtractAudioArgs({ input, output }));
    return new Uint8Array(await readFile(output));
  });
}

export async function convertAudio(inputBytes: Uint8Array, format: AudioFormat, bitrateKbps: number): Promise<{ bytes: Uint8Array; extension: string }> {
  await requireBinary("ffmpeg", "安装 ffmpeg 后该功能可用。");
  return withTempDir("alltools-audio-", async (dir) => {
    const input = await writeInput(dir, inputBytes);
    const output = join(dir, `output.${format}`);
    const { args } = buildAudioConvertArgs({ input, output, format, bitrateKbps });
    await runFfmpeg(args);
    return { bytes: new Uint8Array(await readFile(output)), extension: format };
  });
}
