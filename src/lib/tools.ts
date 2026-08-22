export const toolCategories = [
  {
    id: "pdf",
    label: "PDF 工具",
    description: "拆分、导出与整理 PDF 文件。",
  },
  {
    id: "image",
    label: "图片工具",
    description: "压缩、转换与优化常用图片格式。",
  },
  {
    id: "create",
    label: "生成工具",
    description: "快速生成可下载、可分享的实用内容。",
  },
] as const;

export type ToolCategory = (typeof toolCategories)[number]["id"];

export type ToolDefinition = {
  slug: string;
  category: ToolCategory;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  keywords: readonly string[];
  icon: "split" | "image" | "compress" | "convert" | "qr";
  processing: "browser";
  availability: "ready" | "comingSoon";
  accepts: readonly string[];
};

export const tools: readonly ToolDefinition[] = [
  {
    slug: "pdf-split",
    category: "pdf",
    name: "PDF 拆分",
    shortName: "拆分 PDF",
    description: "按页码范围提取 PDF 页面，生成独立文件。",
    longDescription:
      "选择需要保留的页码或页码范围，在浏览器内生成新的 PDF 文件。原始文档不会上传到服务器。",
    keywords: ["PDF 拆分", "PDF 分页", "提取 PDF 页面", "拆分 PDF 在线"],
    icon: "split",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
  },
  {
    slug: "pdf-to-image",
    category: "pdf",
    name: "PDF 转图片",
    shortName: "PDF 转图片",
    description: "把 PDF 页面导出为清晰的图片文件。",
    longDescription:
      "将 PDF 的指定页面渲染成图片并下载，适合分享、预览或嵌入文档。处理将在浏览器本地完成。",
    keywords: ["PDF 转图片", "PDF 转 JPG", "PDF 转 PNG", "PDF 页面转图片"],
    icon: "image",
    processing: "browser",
    availability: "comingSoon",
    accepts: [".pdf"],
  },
  {
    slug: "image-compress",
    category: "image",
    name: "图片压缩",
    shortName: "压缩图片",
    description: "在可控画质下减小 JPEG、PNG 和 WebP 图片体积。",
    longDescription:
      "选择压缩质量并导出更轻的图片，适合网站上传、邮件发送和即时分享。文件始终留在你的浏览器中。",
    keywords: ["图片压缩", "压缩 JPG", "压缩 PNG", "图片变小"],
    icon: "compress",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "image-convert",
    category: "image",
    name: "图片格式转换",
    shortName: "转换图片",
    description: "在 PNG、JPEG 和 WebP 格式之间快速转换。",
    longDescription:
      "导入常见图片后选择输出格式，浏览器会保留原图在本地并提供新文件下载。",
    keywords: ["图片格式转换", "PNG 转 JPG", "JPG 转 WebP", "图片转 PNG"],
    icon: "convert",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "qr-code",
    category: "create",
    name: "二维码生成器",
    shortName: "生成二维码",
    description: "把链接、文字或联系方式生成可下载二维码。",
    longDescription:
      "输入任意文本或网址，生成清晰二维码图片，可直接下载用于印刷、海报或分享。",
    keywords: ["二维码生成", "在线生成二维码", "网址二维码", "二维码图片"],
    icon: "qr",
    processing: "browser",
    availability: "ready",
    accepts: ["文本", "网址"],
  },
] as const;

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsForCategory(category: ToolCategory): ToolDefinition[] {
  return tools.filter((tool) => tool.category === category);
}
