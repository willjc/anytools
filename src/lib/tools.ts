export const toolCategories = [
  {
    id: "pdf",
    label: "PDF 工具",
    description: "拆分、合并、加水印与整理 PDF 文件。",
  },
  {
    id: "image",
    label: "图片工具",
    description: "裁剪、拼接、加水印与优化常用图片。",
  },
  {
    id: "create",
    label: "生成工具",
    description: "快速生成可下载、可分享的实用内容。",
  },
  {
    id: "av",
    label: "音视频工具",
    description: "压缩视频、提取音频与转换媒体格式。",
  },
  {
    id: "life",
    label: "生活工具",
    description: "换算、日期与金额计算的日常小帮手。",
  },
  {
    id: "network",
    label: "网络工具",
    description: "查 IP、解析域名，网络信息一查便知。",
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
  icon:
    | "split"
    | "image"
    | "compress"
    | "convert"
    | "qr"
    | "merge"
    | "organize"
    | "stamp"
    | "hash"
    | "pen"
    | "fileWord"
    | "crop"
    | "droplets"
    | "layers"
    | "grid"
    | "eraser"
    | "video"
    | "music"
    | "ruler"
    | "calendar"
    | "banknote"
    | "home"
    | "globe";
  processing: "browser" | "cloud";
  availability: "ready" | "comingSoon";
  accepts: readonly string[];
  /** 覆盖卡片底部默认的处理方式标签 */
  cardTag?: string;
  /** 覆盖详情页「如何使用」的默认三步 */
  usageSteps?: readonly [string, string, string];
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
    slug: "pdf-merge",
    category: "pdf",
    name: "PDF 合并",
    shortName: "合并 PDF",
    description: "把多个 PDF 按顺序合并成一个文件。",
    longDescription:
      "上传两个或多个 PDF，调整先后顺序后一键合并为一个新的 PDF 文件。整个合并在浏览器本地完成，原始文档不会上传到服务器。",
    keywords: ["PDF 合并", "合并 PDF", "多个 PDF 合成一个", "PDF 拼接"],
    icon: "merge",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
  },
  {
    slug: "pdf-organize",
    category: "pdf",
    name: "PDF 页面整理",
    shortName: "整理页面",
    description: "删除、旋转或重排 PDF 的指定页面。",
    longDescription:
      "在页面列表中删除不需要的页面、旋转方向不对的页面，或调整页面先后顺序，导出整理好的新 PDF。处理在浏览器本地完成。",
    keywords: ["PDF 页面删除", "PDF 旋转", "PDF 页面排序", "整理 PDF"],
    icon: "organize",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
  },
  {
    slug: "pdf-watermark",
    category: "pdf",
    name: "PDF 加水印",
    shortName: "PDF 水印",
    description: "给 PDF 每一页添加平铺的文字水印。",
    longDescription:
      "输入水印文字，设置字号、角度与密度，为每一页平铺水印保护文档版权。全程在浏览器本地完成，文档不会离开你的电脑。",
    keywords: ["PDF 加水印", "PDF 水印", "文字水印", "PDF 版权保护"],
    icon: "stamp",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
  },
  {
    slug: "pdf-page-numbers",
    category: "pdf",
    name: "PDF 加页码",
    shortName: "PDF 页码",
    description: "为 PDF 页面添加自定义位置的页码。",
    longDescription:
      "选择页码位置、起始编号与格式，为 PDF 每一页插入页码，方便打印和装订。处理在浏览器本地完成。",
    keywords: ["PDF 加页码", "PDF 页码", "PDF 插入页码", "PDF 编号"],
    icon: "hash",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
  },
  {
    slug: "pdf-edit-text",
    category: "pdf",
    name: "PDF 改字",
    shortName: "改 PDF 文字",
    description: "抹掉原文并输入新文字，简单修改 PDF 内容。",
    longDescription:
      "框选 PDF 中需要修改的文字，用白色遮盖后写入新内容，适合改正错别字、金额、日期等简单场景；复杂排版建议使用 PDF 转 Word。处理在浏览器本地完成。",
    keywords: ["PDF 改字", "修改 PDF 文字", "PDF 编辑", "PDF 改内容"],
    icon: "pen",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
  },
  {
    slug: "pdf-to-word",
    category: "pdf",
    name: "PDF 转 Word",
    shortName: "转 Word",
    description: "把 PDF 转换成可编辑的 Word 文档。",
    longDescription:
      "将 PDF 转换为 docx 文档，保留段落结构，方便直接编辑正文。该功能由服务器端完成转换，文件在处理完成后立即删除。",
    keywords: ["PDF 转 Word", "PDF 转 docx", "PDF 可编辑", "PDF 转换器"],
    icon: "fileWord",
    processing: "cloud",
    availability: "ready",
    accepts: [".pdf"],
  },
  {
    slug: "pdf-compress",
    category: "pdf",
    name: "PDF 压缩",
    shortName: "压缩 PDF",
    description: "在尽量保持清晰度的前提下减小 PDF 体积。",
    longDescription:
      "对图片密集的 PDF 进行压缩重建，输出更小的文件，方便邮件发送与上传。该功能由服务器端完成处理。",
    keywords: ["PDF 压缩", "PDF 变小", "压缩 PDF 体积", "PDF 减小"],
    icon: "compress",
    processing: "cloud",
    availability: "ready",
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
    slug: "image-crop",
    category: "image",
    name: "图片裁剪",
    shortName: "裁剪图片",
    description: "按常用比例或自定义区域裁剪图片。",
    longDescription:
      "提供 1:1、4:3、16:9 等常用比例预设，也可以自由框选裁剪区域，立即得到新图片。原图始终留在你的浏览器中。",
    keywords: ["图片裁剪", "在线裁剪", "照片裁剪", "裁剪图片"],
    icon: "crop",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "image-watermark",
    category: "image",
    name: "图片加水印",
    shortName: "图片水印",
    description: "为图片添加文字水印，防止被盗用。",
    longDescription:
      "输入水印文字并调整位置、大小与透明度，为图片添加水印后直接下载，原格式保持不变。处理在浏览器本地完成。",
    keywords: ["图片加水印", "照片水印", "图片防盗", "水印制作"],
    icon: "droplets",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "image-stitch",
    category: "image",
    name: "图片拼接",
    shortName: "拼接长图",
    description: "多张图片横向或纵向拼成一张长图。",
    longDescription:
      "选择多张图片，按横向或纵向无缝拼接成一张长图，适合合并聊天记录、截图与商品列表。全部在浏览器本地完成。",
    keywords: ["图片拼接", "拼长图", "截图合并", "长图制作"],
    icon: "layers",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "image-grid",
    category: "image",
    name: "九宫格切图",
    shortName: "九宫格切图",
    description: "把一张图切成 3×3 九张，方便社交发布。",
    longDescription:
      "上传正方形或任意比例图片，自动切为九宫格并支持逐张下载，发朋友圈不再需要第三方 App。处理在浏览器本地完成。",
    keywords: ["九宫格切图", "朋友圈九宫格", "图片切割", "九格切图"],
    icon: "grid",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "heic-to-jpg",
    category: "image",
    name: "HEIC 转 JPG",
    shortName: "HEIC 转 JPG",
    description: "iPhone HEIC 照片批量转换为 JPG 或 PNG。",
    longDescription:
      "把 iPhone 拍摄的 HEIC/HEIF 照片批量转换为通用的 JPG 或 PNG，解决电脑打不开 iPhone 照片的问题。该功能由服务器完成解码转换。",
    keywords: ["HEIC 转 JPG", "HEIC 转换", "iPhone 照片格式", "HEIF 转 JPEG"],
    icon: "convert",
    processing: "cloud",
    availability: "ready",
    accepts: [".heic", ".heif"],
  },
  {
    slug: "image-cutout",
    category: "image",
    name: "AI 抠图换底色",
    shortName: "AI 抠图",
    description: "一键抠出人像，替换证件照底色。",
    longDescription:
      "上传照片自动识别人像边缘，一键生成透明背景 PNG，或替换为白底、蓝底、红底的证件照。该功能由服务器端的 AI 模型完成。",
    keywords: ["AI 抠图", "证件照换底色", "一键抠图", "透明背景"],
    icon: "eraser",
    processing: "cloud",
    availability: "comingSoon",
    accepts: [".jpg", ".jpeg", ".png"],
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
  {
    slug: "video-compress",
    category: "av",
    name: "视频压缩",
    shortName: "压缩视频",
    description: "减小视频体积，方便聊天软件传输与上传。",
    longDescription:
      "选择目标体积或清晰度，把过大的视频压缩到可发送的大小，尽量减少画质损失。该功能由服务器端的 ffmpeg 完成。",
    keywords: ["视频压缩", "视频变小", "压缩 MP4", "微信发视频"],
    icon: "video",
    processing: "cloud",
    availability: "ready",
    accepts: [".mp4", ".mov", ".mkv", ".avi"],
  },
  {
    slug: "video-to-audio",
    category: "av",
    name: "视频提取音频",
    shortName: "提取音频",
    description: "从视频中一键提取音频并保存为 MP3。",
    longDescription:
      "上传视频文件，快速取出其中的音轨并保存为 MP3，适合提取课程、访谈与演出片段的声音。该功能由服务器完成。",
    keywords: ["视频提取音频", "视频转 MP3", "提取声音", "视频音乐提取"],
    icon: "music",
    processing: "cloud",
    availability: "ready",
    accepts: [".mp4", ".mov", ".mkv", ".webm"],
  },
  {
    slug: "audio-convert",
    category: "av",
    name: "音频格式转换",
    shortName: "音频转换",
    description: "MP3、WAV、M4A 等常见音频格式互相转换。",
    longDescription:
      "在不同音频格式之间自由转换，并可设置比特率控制体积与音质。该功能由服务器端的 ffmpeg 完成。",
    keywords: ["音频格式转换", "MP3 转 WAV", "M4A 转 MP3", "音频转换器"],
    icon: "convert",
    processing: "cloud",
    availability: "ready",
    accepts: [".mp3", ".wav", ".m4a", ".aac", ".flac"],
  },
  {
    slug: "unit-conversion",
    category: "life",
    name: "单位换算",
    shortName: "单位换算",
    description: "长度、重量、温度等常用单位实时换算。",
    longDescription:
      "涵盖长度、重量、温度、面积、体积、速度六大类常用单位，输入即换算，生活学习都用得上。",
    keywords: ["单位换算", "长度单位换算", "公斤转斤", "摄氏华氏"],
    icon: "ruler",
    processing: "browser",
    availability: "ready",
    accepts: ["数值"],
  },
  {
    slug: "date-calculator",
    category: "life",
    name: "日期计算",
    shortName: "日期计算",
    description: "计算两个日期的间隔天数，或推算某日期前后几天。",
    longDescription:
      "输入两个日期立即得到相差天数，也可以从某个日期出发推算之前或之后的日期，安排计划、计算工期都很方便。",
    keywords: ["日期计算", "天数计算", "日期间隔", "日期推算"],
    icon: "calendar",
    processing: "browser",
    availability: "ready",
    accepts: ["日期"],
  },
  {
    slug: "rmb-uppercase",
    category: "life",
    name: "人民币大写",
    shortName: "人民币大写",
    description: "数字金额一键转为规范的中文大写。",
    longDescription:
      "输入阿拉伯数字金额，立即得到标准的人民币大写（例如壹仟贰佰叁拾肆元伍角陆分），开发票、写合同不出错。",
    keywords: ["人民币大写", "金额大写", "数字转大写", "财务大写"],
    icon: "banknote",
    processing: "browser",
    availability: "ready",
    accepts: ["数值"],
  },
  {
    slug: "mortgage-calculator",
    category: "life",
    name: "房贷计算器",
    shortName: "房贷计算器",
    description: "对比等额本息与等额本金的月供和总利息。",
    longDescription:
      "输入贷款金额、年限与利率，同时计算等额本息与等额本金两种方式的月供、利息总额，并给出逐年还款明细。",
    keywords: ["房贷计算器", "等额本息", "等额本金", "月供计算"],
    icon: "home",
    processing: "browser",
    availability: "ready",
    accepts: ["数值"],
  },
  {
    slug: "ip-lookup",
    category: "network",
    name: "IP 查询",
    shortName: "IP 查询",
    description: "查看你的 IP 归属地，或查询任意网站的解析 IP。",
    longDescription:
      "自动显示当前访问者使用的 IP 及其运营商与大致位置；输入任意域名即可查询网站的 A/AAAA/CNAME/MX/NS 等解析记录，并标注每台服务器的归属地。查询在服务器端即时完成，不保存任何记录。",
    keywords: ["IP 查询", "查 IP", "域名解析查询", "网站 IP 查询", "我的 IP"],
    icon: "globe",
    processing: "cloud",
    availability: "ready",
    accepts: ["域名", "IP 地址"],
    cardTag: "在线查询 · 免安装",
    usageSteps: [
      "打开工具页即可看到你当前的 IP 与归属地",
      "输入任意域名（或直接输入 IP），点击查询",
      "即时返回解析记录与服务器归属地，不保存查询历史",
    ],
  },
] as const;

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsForCategory(category: ToolCategory): ToolDefinition[] {
  return tools.filter((tool) => tool.category === category);
}
