export type TextStats = {
  characters: number;
  nonWhitespaceCharacters: number;
  lines: number;
  chineseWords: number;
  englishWords: number;
};

const chineseWordSegmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter("zh-CN", { granularity: "word" }) : null;
const lineCollator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
const hanCharacter = /\p{Script=Han}/u;
const hanCharacters = /\p{Script=Han}/gu;
const englishWord = /\p{Script=Latin}+(?:['’-]\p{Script=Latin}+)*/gu;

function splitLines(text: string): string[] {
  return text.split(/\r\n?|\n/);
}

export function getTextStats(text: string): TextStats {
  const chineseWords = countChineseWords(text);

  return {
    characters: Array.from(text).length,
    nonWhitespaceCharacters: Array.from(text.replace(/\s/gu, "")).length,
    lines: text.length === 0 ? 0 : splitLines(text).length,
    chineseWords,
    englishWords: text.match(englishWord)?.length ?? 0,
  };
}

export function countChineseWords(text: string, segmenter: Intl.Segmenter | null = chineseWordSegmenter): number {
  if (!segmenter) return text.match(hanCharacters)?.length ?? 0;

  let chineseWords = 0;
  for (const segment of segmenter.segment(text)) {
    if (segment.isWordLike && hanCharacter.test(segment.segment)) chineseWords += 1;
  }
  return chineseWords;
}

export function trimLineEdges(text: string): string {
  return splitLines(text).map((line) => line.trim()).join("\n");
}

export function removeBlankLines(text: string): string {
  if (!text) return "";
  return splitLines(text).filter((line) => line.trim().length > 0).join("\n");
}

export function deduplicateLines(text: string): string {
  if (!text) return "";
  return [...new Set(splitLines(text))].join("\n");
}

export function sortLines(text: string): string {
  if (!text) return "";
  return splitLines(text).sort(lineCollator.compare).join("\n");
}
