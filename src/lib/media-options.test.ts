import { describe, expect, it } from "vitest";

import {
  AUDIO_TARGETS,
  VIDEO_HEIGHTS,
  buildAudioConvertArgs,
  buildExtractAudioArgs,
  buildGifCompressArgs,
  buildVideoCompressArgs,
  buildVideoToGifArgs,
  GIF_COMPRESS_LEVELS,
  GIF_MAX_DURATION_SECONDS,
  type VideoHeight,
} from "@/lib/media-options";

describe("buildVideoCompressArgs", () => {
  it("scales to the chosen height and encodes h264 with crf", () => {
    expect(buildVideoCompressArgs({ input: "in.mov", output: "out.mp4", height: 720 })).toEqual([
      "-y", "-i", "in.mov",
      "-vf", "scale=-2:720",
      "-c:v", "libx264", "-crf", "28", "-preset", "veryfast",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "+faststart",
      "out.mp4",
    ]);
  });

  it("rejects unsupported heights", () => {
    expect(() => buildVideoCompressArgs({ input: "a", output: "b", height: 999 as VideoHeight })).toThrow();
  });
});

describe("buildExtractAudioArgs", () => {
  it("extracts a stereo-free mp3 track", () => {
    expect(buildExtractAudioArgs({ input: "in.mp4", output: "out.mp3" })).toEqual([
      "-y", "-i", "in.mp4", "-vn",
      "-c:a", "libmp3lame", "-q:a", "2",
      "out.mp3",
    ]);
  });
});

describe("buildAudioConvertArgs", () => {
  it("maps mp3 to libmp3lame with the requested bitrate", () => {
    const { args } = buildAudioConvertArgs({ input: "in.m4a", output: "out.mp3", format: "mp3", bitrateKbps: 192 });
    expect(args).toContain("libmp3lame");
    expect(args).toContain("192k");
  });

  it("ignores bitrate for wav and uses pcm", () => {
    const { args } = buildAudioConvertArgs({ input: "in.mp3", output: "out.wav", format: "wav", bitrateKbps: 320 });
    expect(args).toContain("pcm_s16le");
    expect(args).not.toContain("320k");
  });

  it("rejects unknown formats and out-of-range bitrates", () => {
    expect(() => buildAudioConvertArgs({ input: "a", output: "b", format: "ogg" as never, bitrateKbps: 192 })).toThrow();
    expect(() => buildAudioConvertArgs({ input: "a", output: "b", format: "mp3", bitrateKbps: 9999 })).toThrow();
  });

  it("covers every advertised target", () => {
    for (const target of AUDIO_TARGETS) {
      const { codec } = buildAudioConvertArgs({ input: "a", output: `o.${target.format}`, format: target.format, bitrateKbps: 192 });
      expect(codec.length).toBeGreaterThan(0);
    }
  });
});

describe("constants", () => {
  it("exposes supported presets used by the UI", () => {
    expect(VIDEO_HEIGHTS).toEqual([1080, 720, 480, 360]);
    expect(AUDIO_TARGETS.map((target) => target.format)).toEqual(["mp3", "m4a", "wav", "flac"]);
  });
});

describe("buildVideoToGifArgs", () => {
  it("builds filter chain with palette two-pass and seek flags", () => {
    const args = buildVideoToGifArgs({
      input: "in.mp4",
      output: "out.gif",
      fps: 15,
      width: 480,
      startSeconds: 3.5,
      durationSeconds: 10,
    });
    expect(args).toContain("-ss");
    expect(args).toContain("3.50");
    expect(args).toContain("-t");
    expect(args).toContain("10.00");
    const filter = args[args.indexOf("-vf") + 1];
    expect(filter).toContain("fps=15");
    expect(filter).toContain("scale=480:-1:flags=lanczos");
    expect(filter).toContain("palettegen");
    expect(filter).toContain("paletteuse");
    expect(args[args.length - 3]).toBe("-loop");
    expect(args[args.length - 2]).toBe("0");
  });

  it("omits seek flags when starting from zero without duration", () => {
    const args = buildVideoToGifArgs({
      input: "in.mp4",
      output: "out.gif",
      fps: 10,
      width: 0,
      startSeconds: 0,
      durationSeconds: 0,
    });
    expect(args).not.toContain("-ss");
    expect(args).not.toContain("-t");
    expect(args[args.indexOf("-vf") + 1]).toContain("scale=iw:-1");
  });

  it("clamps negative start and oversized duration", () => {
    const args = buildVideoToGifArgs({
      input: "in.mp4",
      output: "out.gif",
      fps: 24,
      width: 720,
      startSeconds: -5,
      durationSeconds: GIF_MAX_DURATION_SECONDS + 100,
    });
    expect(args).not.toContain("-ss");
    expect(args[args.indexOf("-t") + 1]).toBe(GIF_MAX_DURATION_SECONDS.toFixed(2));
  });

  it("rejects invalid fps and width", () => {
    expect(() => buildVideoToGifArgs({ input: "i", output: "o", fps: 60 as never, width: 480, startSeconds: 0, durationSeconds: 5 })).toThrow();
    expect(() => buildVideoToGifArgs({ input: "i", output: "o", fps: 15, width: 1080 as never, startSeconds: 0, durationSeconds: 5 })).toThrow();
  });
});

describe("buildGifCompressArgs", () => {
  it("applies every level preset", () => {
    for (const preset of GIF_COMPRESS_LEVELS) {
      const args = buildGifCompressArgs({ input: "in.gif", output: "out.gif", level: preset.id });
      const filter = args[args.indexOf("-vf") + 1];
      expect(filter).toContain(`fps=${preset.fps}`);
      expect(filter).toContain(`max_colors=${preset.maxColors}`);
    }
  });

  it("rejects unknown levels", () => {
    expect(() => buildGifCompressArgs({ input: "i", output: "o", level: "extreme" as never })).toThrow();
  });
});
