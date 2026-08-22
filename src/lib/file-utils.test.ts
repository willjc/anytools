import { describe, expect, it } from "vitest";

import { formatFileSize, getDownloadFileName } from "@/lib/file-utils";

describe("formatFileSize", () => {
  it("uses readable binary units", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(12 * 1024 * 1024)).toBe("12 MB");
  });

  it("handles invalid values", () => {
    expect(formatFileSize(-1)).toBe("未知大小");
  });
});

describe("getDownloadFileName", () => {
  it("replaces the old extension and retains dots in the base name", () => {
    expect(getDownloadFileName("photo.final.png", "-compressed", "webp")).toBe("photo.final-compressed.webp");
  });

  it("works without a source extension", () => {
    expect(getDownloadFileName("document", "-split", ".pdf")).toBe("document-split.pdf");
  });
});
