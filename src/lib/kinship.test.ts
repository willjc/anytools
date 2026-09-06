import { describe, expect, it } from "vitest";

import { appendChainToken, kinshipChainFromTerm, kinshipFromChain, removeLastToken } from "@/lib/kinship";

describe("kinshipFromChain", () => {
  it("resolves a simple chain", () => {
    expect(kinshipFromChain("爸爸的爸爸", "male")).toContain("爷爷");
    expect(kinshipFromChain("妈妈的妈妈", "male")).toContain("外婆");
  });

  it("resolves cousin relations", () => {
    const terms = kinshipFromChain("爸爸的姐姐的儿子", "male");
    expect(terms).toEqual(expect.arrayContaining(["姑表哥", "姑表弟"]));
  });

  it("returns empty for empty input", () => {
    expect(kinshipFromChain("   ", "male")).toEqual([]);
  });

  it("does not throw on nonsense chains", () => {
    expect(() => kinshipFromChain("爸爸的妻子的妻子的", "male")).not.toThrow();
  });
});

describe("kinshipChainFromTerm", () => {
  it("explains a term as relationship chains", () => {
    const chains = kinshipChainFromTerm("舅公");
    expect(chains.length).toBeGreaterThan(0);
    expect(chains[0]).toContain("爸爸的妈妈的");
  });

  it("returns empty for empty input", () => {
    expect(kinshipChainFromTerm("")).toEqual([]);
  });
});

describe("chain helpers", () => {
  it("appends tokens with the possessive mark", () => {
    expect(appendChainToken("", "爸爸")).toBe("爸爸");
    expect(appendChainToken("爸爸", "哥哥")).toBe("爸爸的哥哥");
  });

  it("removes the last token", () => {
    expect(removeLastToken("爸爸的哥哥")).toBe("爸爸");
    expect(removeLastToken("爸爸")).toBe("");
    expect(removeLastToken("")).toBe("");
  });
});
