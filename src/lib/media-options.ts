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
