export const site = {
  name: "万用工具箱",
  shortName: "万用工具箱",
  description: "在浏览器本地完成 PDF、图片和二维码处理的轻量工具集。",
  locale: "zh_CN",
} as const;

function getHttpUrl(value: string | undefined): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return undefined;
    }

    return url.origin;
  } catch {
    return undefined;
  }
}

export function getSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  const fallback = "http://localhost:3000";
  return getHttpUrl(value) ?? fallback;
}

export const siteUrl = getSiteUrl();
export const privateQueryUrl = getHttpUrl(process.env.NEXT_PUBLIC_PRIVATE_QUERY_URL);
