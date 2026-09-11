import { describe, expect, it } from "vitest";

import { buildEbookConvertArgs } from "@/lib/server/ebook";
import { isEbookInputFormat, isEbookOutputFormat } from "@/lib/ebook-formats";

describe("buildEbookConvertArgs", () => {
  it("adds a4 paper and margins for pdf output", () => {
    const args = buildEbookConvertArgs({ input: "in.epub", output: "out.pdf", format: "pdf" });
    expect(args[0]).toBe("in.epub");
    expect(args[1]).toBe("out.pdf");
    expect(args).toContain("--paper-size");
    expect(args[args.indexOf("--paper-size") + 1]).toBe("a4");
    expect(args).toContain("--pdf-page-margin-left");
  });

  it("keeps plain input-output args for non-pdf targets", () => {
    expect(buildEbookConvertArgs({ input: "in.epub", output: "out.txt", format: "txt" })).toEqual(["in.epub", "out.txt"]);
  });
});

describe("format guards", () => {
  it("recognises supported input and output formats", () => {
    expect(isEbookInputFormat("epub")).toBe(true);
    expect(isEbookInputFormat("exe")).toBe(false);
    expect(isEbookOutputFormat("mobi")).toBe(true);
    expect(isEbookOutputFormat("html")).toBe(false);
  });
});
