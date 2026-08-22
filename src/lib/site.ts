export const site = {
  name: "万用工具箱",
  shortName: "万用工具箱",
  description: "在浏览器本地完成 PDF、图片和二维码处理的轻量工具集。",
  locale: "zh_CN",
} as const;

export function getSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  const fallback = "http://localhost:3000";
  const candidate = value?.trim() || fallback;

  try {
    const url = new URL(candidate);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return fallback;
    }

    return url.origin;
  } catch {
    return fallback;
  }
}

export const siteUrl = getSiteUrl();
