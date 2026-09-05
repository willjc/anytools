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
    | "globe"
    | "presentation"
    | "lock"
    | "scanText"
    | "clapper"
    | "text";
  processing: "browser" | "cloud";
  availability: "ready" | "comingSoon";
  accepts: readonly string[];
  /** 覆盖详情页头部的处理方式标签 */
  headerTag?: string;
  /** 覆盖卡片底部默认的处理方式标签 */
  cardTag?: string;
  /** 覆盖详情页「如何使用」的默认三步 */
  usageSteps?: readonly [string, string, string];
};

export const tools: readonly ToolDefinition[] = [
  {
    slug: "transfer",
    category: "network",
    name: "随手传",
    shortName: "随手传",
    description: "跨设备保存文字和文件，一键分享给别人。",
    longDescription: "登录同一个账号，在不同电脑或手机间取用文字与文件。支持单文件 1 GB、断点续传、保存 3 年，也能生成无需注册的分享链接。",
    keywords: ["随手传", "跨设备传文件", "文字传输", "文件分享", "断点续传"],
    icon: "globe",
    processing: "cloud",
    availability: "ready",
    accepts: ["任意文件", "文字"],
    headerTag: "云端保存 · 3 年有效",
    cardTag: "云端保存",
    usageSteps: ["创建账号，保存文字或上传文件", "其他设备登录同一账号，复制或下载", "生成分享链接，别人无需注册即可取用"],
  },
  {
    slug: "ai-ppt",
    category: "create",
    name: "AI PPT 生成器",
    shortName: "AI 做 PPT",
    description: "输入主题或大纲，AI 逐页生成可下载编辑的 PPT。",
    longDescription:
      "输入一个主题或粘贴大纲、会议纪要等素材，选择目标页数与受众，AI 会逐页撰写标题、要点与演讲备注，右侧实时预览，满意后直接下载可在 PowerPoint / WPS 中继续编辑的 PPTX 文件。内容由 DeepSeek 在云端生成，请核实数据与结论。",
    keywords: ["AI PPT", "PPT 生成", "AI 生成 PPT", "一键生成 PPT", "PPT 大纲", "AI 做幻灯片"],
    icon: "presentation",
    processing: "cloud",
    availability: "ready",
    accepts: ["主题", "文本", ".txt", ".md"],
    headerTag: "AI 云端生成 · 内容将发送至 DeepSeek",
    cardTag: "AI 云端生成",
    usageSteps: [
      "输入主题或粘贴大纲素材，选择目标页数与受众",
      "点击生成，AI 逐页撰写，右侧实时预览",
      "满意后下载 PPTX 文件，可在 Office / WPS 中继续编辑",
    ],
  },
  {
    slug: "pdf-protect",
    category: "pdf",
    name: "PDF 加密与解锁",
    shortName: "PDF 加密解锁",
    description: "给 PDF 设打开密码与权限，或解除密码限制。",
    longDescription:
      "两种模式：给 PDF 加上 256 位 AES 打开密码，并可分别控制是否允许打印、复制、编辑；或解除已有 PDF 的密码与权限限制（仅限制编辑的文件可直接解除，设了打开密码的需输入密码）。文件由服务器端 qpdf 处理，完成后立即删除。请仅处理你有权操作的文件。",
    keywords: ["PDF 加密", "PDF 解密", "PDF 解除限制", "PDF 设密码", "PDF 去掉密码", "PDF 解锁"],
    icon: "lock",
    processing: "cloud",
    availability: "ready",
    accepts: [".pdf"],
    usageSteps: [
      "选择「加密」或「解除限制」模式并选择 PDF 文件",
      "加密模式设置密码与权限；解锁模式按需输入打开密码",
      "处理完成后自动下载新文件，服务器不留存任何副本",
    ],
  },
  {
    slug: "image-to-text",
    category: "image",
    name: "图片转文字",
    shortName: "图片转文字",
    description: "OCR 识别截图、照片中的文字，可复制下载。",
    longDescription:
      "上传图片即可提取其中的文字内容，支持中文与多种语言，识别结果可一键复制或下载为 TXT。识别由 MinerU 云端完成，表格会以文本形式还原。图片处理完成后立即删除。",
    keywords: ["图片转文字", "OCR 在线识别", "截图识别文字", "照片提取文字", "图片文字提取"],
    icon: "scanText",
    processing: "cloud",
    availability: "ready",
    accepts: [".png", ".jpg", ".jpeg", ".jp2", ".webp", ".gif", ".bmp"],
    cardTag: "MinerU 云端识别",
    usageSteps: [
      "选择 PNG、JPG 等常见图片",
      "提交 MinerU 云端识别，请保持页面打开",
      "复制识别结果或下载 TXT 文件",
    ],
  },
  {
    slug: "video-to-gif",
    category: "av",
    name: "视频转 GIF",
    shortName: "视频转 GIF",
    description: "截取视频片段转成高清 GIF 动图。",
    longDescription:
      "选择视频并设定开始时间、时长、帧率与宽度，由服务器端 ffmpeg 以调色板算法生成画质更好的 GIF 动图，适合聊天分享与社交发布。单次最长 60 秒，文件处理完立即删除。",
    keywords: ["视频转 GIF", "MP4 转 GIF", "视频截取动图", "GIF 制作", "视频转动图"],
    icon: "clapper",
    processing: "cloud",
    availability: "ready",
    accepts: [".mp4", ".mov", ".mkv", ".avi", ".webm"],
    usageSteps: [
      "选择视频文件，设定开始时间与时长（最长 60 秒）",
      "选择帧率与宽度，帧率越高越流畅、体积越大",
      "转换完成后自动下载 GIF",
    ],
  },
  {
    slug: "gif-compress",
    category: "av",
    name: "GIF 压缩",
    shortName: "GIF 压缩",
    description: "在可接受的画质下把过大的 GIF 变小。",
    longDescription:
      "上传过大的 GIF，通过重排调色板、降低帧率与色数来减小体积，提供轻度、中度、强力三档强度，方便聊天软件发送。该功能由服务器端 ffmpeg 完成，处理后立即删除。",
    keywords: ["GIF 压缩", "GIF 变小", "GIF 减小体积", "GIF 过大", "动图压缩"],
    icon: "clapper",
    processing: "cloud",
    availability: "ready",
    accepts: [".gif"],
    usageSteps: [
      "选择需要压缩的 GIF 文件",
      "选择压缩强度：轻度保画质，强力尽量小",
      "压缩完成后自动下载",
    ],
  },
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
    slug: "pdf-to-image",
    category: "pdf",
    name: "PDF 转图片",
    shortName: "PDF 转图片",
    description: "把 PDF 页面转换为 PNG 或 JPG 图片。",
    longDescription:
      "选择页码范围与输出格式，把 PDF 页面逐页转换为清晰图片并下载。处理在浏览器本地完成，文档不会上传到服务器。",
    keywords: ["PDF 转图片", "PDF 转 JPG", "PDF 转 PNG", "PDF 页面导出"],
    icon: "image",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
  },
  {
    slug: "image-to-pdf",
    category: "pdf",
    name: "图片转 PDF",
    shortName: "图片转 PDF",
    description: "把多张图片按顺序合成一个 PDF。",
    longDescription:
      "选择多张 JPG、PNG 或 WebP 图片，调整顺序并按原图或 A4 页面生成一个 PDF。全部处理在浏览器本地完成。",
    keywords: ["图片转 PDF", "JPG 转 PDF", "PNG 转 PDF", "多图合成 PDF"],
    icon: "convert",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "word-to-pdf",
    category: "pdf",
    name: "Word 转 PDF",
    shortName: "Word 转 PDF",
    description: "把 Word 文档转换为便于分享的 PDF。",
    longDescription:
      "上传 doc 或 docx 文档，由服务器端 LibreOffice 转换为 PDF，处理完成后立即清理临时文件。",
    keywords: ["Word 转 PDF", "DOCX 转 PDF", "DOC 转 PDF", "Word 转换器"],
    icon: "fileWord",
    processing: "cloud",
    availability: "ready",
    accepts: [".doc", ".docx"],
  },
  {
    slug: "pdf-signature",
    category: "pdf",
    name: "PDF 签名 / 盖章",
    shortName: "PDF 签名盖章",
    description: "把签名或印章图片放到 PDF 指定页面。",
    longDescription:
      "上传 PDF 与签名或印章图片，在预览中选择页面、位置和大小后导出新文件。处理在浏览器本地完成；本工具不生成数字证书签名。",
    keywords: ["PDF 签名", "PDF 盖章", "PDF 插入印章", "PDF 添加签名图片"],
    icon: "stamp",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf", ".png", ".jpg", ".jpeg"],
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
    slug: "image-resize",
    category: "image",
    name: "图片改尺寸",
    shortName: "图片改尺寸",
    description: "批量按宽高或比例调整图片尺寸。",
    longDescription:
      "一次选择多张图片，设置目标宽高并选择是否保持原比例，批量生成新尺寸图片。全部处理在浏览器本地完成。",
    keywords: ["图片改尺寸", "图片缩放", "批量调整图片大小", "修改图片宽高"],
    icon: "ruler",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "image-redact",
    category: "image",
    name: "图片隐私遮挡",
    shortName: "隐私遮挡",
    description: "框选图片中的敏感信息并永久遮挡。",
    longDescription:
      "在图片上框选姓名、号码、地址等敏感区域，用实色遮挡后导出新图片。处理在浏览器本地完成，原图不会上传。",
    keywords: ["图片隐私遮挡", "图片打码", "遮挡敏感信息", "照片脱敏"],
    icon: "eraser",
    processing: "browser",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  {
    slug: "text-to-image",
    category: "create",
    name: "文字长图生成器",
    shortName: "文字长图",
    description: "把长文字排成精美图片，发微博、朋友圈专用。",
    longDescription:
      "粘贴长文字，选择素笺、卡片、竖排、墨色四种版式，搭配思源宋体、毛笔楷书、行书、龙藏手写等开源字体（OFL 协议），可加标题与落款，实时预览后一键下载 PNG 或复制到剪贴板。全部生成在浏览器本地完成，文字不上传。",
    keywords: ["文字生成图片", "长图制作", "微博长图", "文字转图片", "朋友圈长图", "毛笔字图片"],
    icon: "text",
    processing: "browser",
    availability: "ready",
    accepts: ["文本"],
    usageSteps: [
      "粘贴长文字，可选填标题与落款",
      "挑选版式、字体与强调色，右侧实时预览",
      "下载 PNG 长图或直接复制图片发布",
    ],
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
    slug: "text-cleaner",
    category: "create",
    name: "文本整理与字数统计",
    shortName: "文本整理",
    description: "清理重复空行、整理文本并实时统计字数。",
    longDescription:
      "粘贴文本即可统计字符、非空字符、行数与中英文词数，还可去首尾空格、删除空行、去重或排序。全部处理在浏览器本地完成。",
    keywords: ["文本整理", "字数统计", "删除空行", "文本去重", "字符统计"],
    icon: "eraser",
    processing: "browser",
    availability: "ready",
    accepts: ["文本"],
  },
  {
    slug: "markdown-export",
    category: "create",
    name: "Markdown 转 Word / PDF",
    shortName: "Markdown 导出",
    description: "把 Markdown 文档转换为 Word 或 PDF。",
    longDescription:
      "上传 Markdown 文件并选择 docx 或 PDF 输出，保留标题、列表、表格与代码块。文件由服务器端转换，完成后立即删除。",
    keywords: ["Markdown 转 Word", "Markdown 转 PDF", "MD 转 docx", "Markdown 导出"],
    icon: "fileWord",
    processing: "cloud",
    availability: "ready",
    accepts: [".md", ".markdown"],
  },
  {
    slug: "document-to-markdown",
    category: "create",
    name: "文档转 Markdown",
    shortName: "转 Markdown",
    description: "用 MinerU 识别 Word、PDF 和图片为 Markdown。",
    longDescription:
      "上传 Word、PDF 或常见图片，由 MinerU 云端识别正文、表格与公式，并生成可下载的 Markdown 文件。文件会转交第三方云服务处理。",
    keywords: ["文档转 Markdown", "PDF 转 Markdown", "Word 转 Markdown", "图片 OCR", "MinerU"],
    icon: "convert",
    processing: "cloud",
    availability: "ready",
    accepts: [".doc", ".docx", ".pdf", ".png", ".jpg", ".jpeg", ".jp2", ".webp", ".gif", ".bmp"],
    cardTag: "MinerU 云端识别",
    usageSteps: [
      "选择 Word、PDF 或图片文件",
      "文件提交 MinerU 云端识别，请保持页面打开",
      "识别完成后下载 Markdown 文件",
    ],
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
