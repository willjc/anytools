import { describe, expect, it } from "vitest";

import { buildEncryptArgs, type PdfEncryptionOptions } from "@/lib/server/qpdf";

const baseOptions: PdfEncryptionOptions = {
  userPassword: "open123",
  ownerPassword: "owner456",
  allowPrint: true,
  allowCopy: false,
  allowModify: false,
};

describe("buildEncryptArgs", () => {
  it("builds 256-bit positional args with permission flags", () => {
    expect(buildEncryptArgs(baseOptions)).toEqual([
      "--encrypt",
      "open123",
      "owner456",
      "256",
      "--print=full",
      "--modify=none",
      "--extract=n",
      "--",
    ]);
  });

  it("falls back to the user password when owner password is empty", () => {
    const args = buildEncryptArgs({ ...baseOptions, ownerPassword: "" });
    expect(args[2]).toBe("open123");
  });

  it("rejects options without any password", () => {
    expect(() => buildEncryptArgs({ ...baseOptions, userPassword: "", ownerPassword: "" })).toThrow(/至少设置一个密码/);
  });

  it("maps permission toggles to qpdf flags", () => {
    const args = buildEncryptArgs({ ...baseOptions, allowPrint: false, allowCopy: true, allowModify: true });
    expect(args).toContain("--print=none");
    expect(args).toContain("--extract=y");
    expect(args).toContain("--modify=full");
  });
});
