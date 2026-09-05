export const VIDEO_HEIGHTS = [1080, 720, 480, 360] as const;
export type VideoHeight = (typeof VIDEO_HEIGHTS)[number];

export const AUDIO_TARGETS = [
  { format: "mp3", codec: "libmp3lame", label: "MP3" },
  { format: "m4a", codec: "aac", label: "M4A" },
  { format: "wav", codec: "pcm_s16le", label: "WAV" },
  { format: "flac", codec: "flac", label: "FLAC" },
] as const;
export type AudioFormat = (typeof AUDIO_TARGETS)[number]["format"];

const LOSSY_BITRATES = [96, 128, 192, 256, 320] as const;

export function buildVideoCompressArgs({ input, output, height }: { input: string; output: string; height: VideoHeight }): string[] {
  if (!VIDEO_HEIGHTS.includes(height)) {
    throw new Error(`不支持的目标高度：${height}`);
  }
  return [
    "-y",
    "-i", input,
    "-vf", `scale=-2:${height}`,
    "-c:v", "libx264", "-crf", "28", "-preset", "veryfast",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    output,
  ];
}

export function buildExtractAudioArgs({ input, output }: { input: string; output: string }): string[] {
  return ["-y", "-i", input, "-vn", "-c:a", "libmp3lame", "-q:a", "2", output];
}

export function buildAudioConvertArgs({ input, output, format, bitrateKbps }: {
  input: string;
  output: string;
  format: AudioFormat;
  bitrateKbps: number;
}): { args: string[]; codec: string } {
  const target = AUDIO_TARGETS.find((item) => item.format === format);
  if (!target) {
    throw new Error(`不支持的音频格式：${format}`);
  }
  if (target.codec !== "pcm_s16le" && target.codec !== "flac") {
    if (!LOSSY_BITRATES.includes(bitrateKbps as (typeof LOSSY_BITRATES)[number])) {
      throw new Error(`不支持的比特率：${bitrateKbps}kbps`);
    }
    return {
      args: ["-y", "-i", input, "-c:a", target.codec, "-b:a", `${bitrateKbps}k`, output],
      codec: target.codec,
    };
  }
  return { args: ["-y", "-i", input, "-c:a", target.codec, output], codec: target.codec };
}

export const GIF_FPS = [10, 15, 24] as const;
export type GifFps = (typeof GIF_FPS)[number];

export const GIF_WIDTHS = [360, 480, 720, 0] as const;
export type GifWidth = (typeof GIF_WIDTHS)[number];

/** 单次 GIF 转换允许截取的最长时长（秒） */
export const GIF_MAX_DURATION_SECONDS = 60;

export type VideoToGifOptions = {
  fps: GifFps;
  width: GifWidth;
  /** 开始秒数，负数视为 0 */
  startSeconds: number;
  /** 截取秒数，0 表示到结尾 */
  durationSeconds: number;
};

function clampNonNegative(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(max, value);
}

export function buildVideoToGifArgs({ input, output, fps, width, startSeconds, durationSeconds }: {
  input: string;
  output: string;
} & VideoToGifOptions): string[] {
  if (!GIF_FPS.includes(fps)) {
    throw new Error(`不支持的帧率：${fps}`);
  }
  if (!GIF_WIDTHS.includes(width)) {
    throw new Error(`不支持的宽度：${width}`);
  }
  const start = clampNonNegative(startSeconds, 3600).toFixed(2);
  const duration = clampNonNegative(durationSeconds, GIF_MAX_DURATION_SECONDS);
  const scale = width === 0 ? "scale=iw:-1:flags=lanczos" : `scale=${width}:-1:flags=lanczos`;
  const args = ["-y"];
  if (start !== "0.00") args.push("-ss", start);
  if (duration > 0) args.push("-t", duration.toFixed(2));
  args.push(
    "-i", input,
    "-vf", `fps=${fps},${scale},split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    "-loop", "0",
    output,
  );
  return args;
}

export const GIF_COMPRESS_LEVELS = [
  { id: "light", label: "轻度 · 画质优先", fps: 15, width: 0, maxColors: 128 },
  { id: "balanced", label: "中度 · 推荐", fps: 12, width: 640, maxColors: 64 },
  { id: "strong", label: "强力 · 尽量小", fps: 10, width: 480, maxColors: 32 },
] as const;
export type GifCompressLevel = (typeof GIF_COMPRESS_LEVELS)[number]["id"];

export function buildGifCompressArgs({ input, output, level }: { input: string; output: string; level: GifCompressLevel }): string[] {
  const preset = GIF_COMPRESS_LEVELS.find((item) => item.id === level);
  if (!preset) {
    throw new Error(`不支持的压缩级别：${level}`);
  }
  const scale = preset.width === 0 ? "scale=iw:-1:flags=lanczos" : `scale=${preset.width}:-2:flags=lanczos`;
  return [
    "-y",
    "-i", input,
    "-vf", `fps=${preset.fps},${scale},split[a][b];[a]palettegen=max_colors=${preset.maxColors}[p];[b][p]paletteuse=dither=bayer:bayer_scale=5`,
    "-loop", "0",
    output,
  ];
}
