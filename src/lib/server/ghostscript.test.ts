import { describe, expect, it } from "vitest";

import { buildGhostscriptArgs, COMPRESS_LEVELS, isCompressLevel } from "@/lib/server/ghostscript";

describe("isCompressLevel", () => {
  it("accepts the three supported levels", () => {
    expect(isCompressLevel("light")).toBe(true);
    expect(isCompressLevel("balanced")).toBe(true);
    expect(isCompressLevel("extreme")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isCompressLevel("ultra")).toBe(false);
    expect(isCompressLevel("")).toBe(false);
    expect(isCompressLevel(null)).toBe(false);
    expect(isCompressLevel(undefined)).toBe(false);
  });

  it("lists exactly three levels", () => {
    expect(COMPRESS_LEVELS).toEqual(["light", "balanced", "extreme"]);
  });
});

describe("buildGhostscriptArgs", () => {
  it("uses /ebook for balanced", () => {
    const args = buildGhostscriptArgs("in.pdf", "out.pdf", "balanced");
    expect(args).toContain("-sDEVICE=pdfwrite");
    expect(args).toContain("-dPDFSETTINGS=/ebook");
    expect(args[args.length - 1]).toBe("in.pdf");
    expect(args.some((a) => a.startsWith("-sOutputFile="))).toBe(true);
  });

  it("uses /screen for extreme", () => {
    expect(buildGhostscriptArgs("in.pdf", "out.pdf", "extreme")).toContain("-dPDFSETTINGS=/screen");
  });

  it("writes to the requested output path", () => {
    const args = buildGhostscriptArgs("in.pdf", "my-output.pdf", "balanced");
    expect(args).toContain("-sOutputFile=my-output.pdf");
  });
});
