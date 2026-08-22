export const site = {
  name: "万用工具箱",
  shortName: "万用工具箱",
  description: "在浏览器本地完成 PDF、图片和二维码处理的轻量工具集。",
  locale: "zh_CN",
} as const;

function parseHttpUrl(value: string | undefined): URL | undefined {
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

    return url;
  } catch {
    return undefined;
  }
}

export function getSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  const fallback = "http://localhost:3000";
  return parseHttpUrl(value)?.origin ?? fallback;
}

export function getPrivateQueryUrl(value = process.env.NEXT_PUBLIC_PRIVATE_QUERY_URL): string | undefined {
  return parseHttpUrl(value)?.toString();
}

export const siteUrl = getSiteUrl();
export const privateQueryUrl = getPrivateQueryUrl();
