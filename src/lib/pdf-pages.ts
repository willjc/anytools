type PageSelectionResult = { pages: number[] } | { error: string };

export function parsePageSelection(input: string, pageCount: number): PageSelectionResult {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return { error: "PDF 没有可处理的页面。" };
  }

  const parts = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { error: "请输入页码，例如 1-3, 5。" };
  }

  const selectedPages = new Set<number>();

  for (const part of parts) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) {
      return { error: `“${part}”不是有效的页码或页码范围。` };
    }

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > pageCount) {
      return { error: `页码范围必须在 1 到 ${pageCount} 之间。` };
    }

    for (let page = start; page <= end; page += 1) {
      selectedPages.add(page);
    }
  }

  return { pages: [...selectedPages].sort((a, b) => a - b) };
}
