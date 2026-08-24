import { describe, expect, it } from "vitest";

import {
  AUDIO_TARGETS,
  VIDEO_HEIGHTS,
  buildAudioConvertArgs,
  buildExtractAudioArgs,
  buildVideoCompressArgs,
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
