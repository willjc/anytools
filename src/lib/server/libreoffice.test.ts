import { describe, expect, it } from "vitest";

import { isWordDocument } from "@/lib/server/libreoffice";

function zipWithEntries(names: string[], sizes?: { compressed: number; uncompressed: number }): Buffer {
  const localRecords: Buffer[] = [];
  const centralRecords: Buffer[] = [];
  let localOffset = 0;

  for (const name of names) {
    const nameBytes = Buffer.from(name);
    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(nameBytes.length, 26);
    nameBytes.copy(local, 30);
    localRecords.push(local);

    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt32LE(sizes?.compressed ?? 0, 20);
    central.writeUInt32LE(sizes?.uncompressed ?? 0, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(localOffset, 42);
    nameBytes.copy(central, 46);
    centralRecords.push(central);
    localOffset += local.length;
  }

  const centralSize = centralRecords.reduce((total, record) => total + record.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(names.length, 8);
  end.writeUInt16LE(names.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localRecords, ...centralRecords, end]);
}

describe("isWordDocument", () => {
  it("recognizes legacy Word and docx container markers", () => {
    const legacyHeader = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const legacyName = Buffer.from("WordDocument", "utf16le");
    expect(isWordDocument(Buffer.concat([legacyHeader, legacyName]), "doc")).toBe(true);

    expect(isWordDocument(zipWithEntries(["[Content_Types].xml", "word/document.xml"]), "docx")).toBe(true);
  });

  it("rejects files whose contents do not match the extension", () => {
    expect(isWordDocument(new TextEncoder().encode("not a document"), "doc")).toBe(false);
    expect(isWordDocument(new TextEncoder().encode("PK\u0003\u0004word/document.xml"), "docx")).toBe(false);
    expect(isWordDocument(Buffer.concat([
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      Buffer.from("Workbook", "utf16le"),
    ]), "doc")).toBe(false);
    expect(isWordDocument(zipWithEntries(
      ["[Content_Types].xml", "word/document.xml"],
      { compressed: 1024, uncompressed: 201 * 1024 * 1024 },
    ), "docx")).toBe(false);
    expect(isWordDocument(zipWithEntries(
      ["[Content_Types].xml", "word/document.xml"],
      { compressed: 1024, uncompressed: 20 * 1024 * 1024 },
    ), "docx")).toBe(false);
  });
});
