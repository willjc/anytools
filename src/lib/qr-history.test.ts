import { describe, expect, it } from "vitest";

import { parseQrHistory, QR_HISTORY_LIMIT } from "@/lib/qr-history";

describe("parseQrHistory", () => {
  it("ignores corrupt entries and keeps at most the latest twelve", () => {
    const valid = Array.from({ length: QR_HISTORY_LIMIT + 2 }, (_, index) => ({
      content: `code-${index}`,
      dataUrl: "data:image/png;base64,AA==",
      createdAt: index,
    }));

    expect(parseQrHistory(JSON.stringify([{ content: "bad" }, ...valid]))).toEqual(valid.slice(0, QR_HISTORY_LIMIT));
    expect(parseQrHistory("not-json")).toEqual([]);
  });
});
