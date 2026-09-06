import { describe, expect, it } from "vitest";

import { addToHistory, extractChineseChars, guessTargetChar, sanitizeQuery } from "@/lib/hanzi-learn";

describe("extractChineseChars", () => {
  it("extracts unique cjk chars in order", () => {
    expect(extractChineseChars("节约的约")).toEqual(["节", "约", "的"]);
    expect(extractChineseChars("hello 你好 123 好")).toEqual(["你", "好"]);
  });

  it("caps the candidate count", () => {
    expect(extractChineseChars("一二三四五六七八九十甲乙丙丁戊己")).toHaveLength(12);
  });
});

describe("guessTargetChar", () => {
  it("prefers the char after 的 in the pattern x的y", () => {
    expect(guessTargetChar("节约的约")).toBe("约");
    expect(guessTargetChar("大城市的城")).toBe("城");
  });

  it("falls back to the last chinese char", () => {
    expect(guessTargetChar("光")).toBe("光");
    expect(guessTargetChar("我们是共产主义接班人")).toBe("人");
  });

  it("returns null for empty or non-cjk input", () => {
    expect(guessTargetChar("")).toBeNull();
    expect(guessTargetChar("abc 123")).toBeNull();
  });
});

describe("sanitizeQuery", () => {
  it("keeps only cjk chars and caps length", () => {
    expect(sanitizeQuery("的guó王")).toBe("的王");
    expect(sanitizeQuery("一二三四五六七")).toBe("一二三四五六");
  });
});

describe("history", () => {
  it("adds to front and dedupes by char", () => {
    let history = addToHistory([], "约", "节约");
    history = addToHistory(history, "节", "节约");
    history = addToHistory(history, "约", "节约的约");
    expect(history.map((item) => item.char)).toEqual(["约", "节"]);
  });

  it("caps history length", () => {
    let history: ReturnType<typeof addToHistory> = [];
    for (let i = 0; i < 60; i += 1) {
      history = addToHistory(history, `字${i}`, "");
    }
    expect(history).toHaveLength(50);
  });
});
