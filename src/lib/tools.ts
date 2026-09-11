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
    | "text"
    | "party"
    | "users"
    | "screen"
    | "percent"
    | "receipt"
    | "scale"
    | "wallet"
    | "pulse"
    | "pill"
    | "calheart"
    | "mail"
    | "calculator"
    | "volume"
    | "printer"
    | "wifi"
    | "brush"
    | "scissors"
    | "book"
    | "tag"
    | "markdown";
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
    slug: "pdf-to-excel",
    category: "pdf",
    name: "PDF 转 Excel",
    shortName: "PDF 转 Excel",
    description: "还原 PDF 中的表格为可编辑的 Excel 文件。",
    longDescription:
      "上传含表格的 PDF（报表、账单、成绩单等），MinerU 云端识别表格结构并还原为行列数据，逐表预览后下载 xlsx 文件，每个表格对应一个工作表，数字自动转为可计算的单元格。复杂合并单元格可能出现错位，文件处理完立即删除。",
    keywords: ["PDF 转 Excel", "PDF 表格提取", "PDF 表格转 Excel", "PDF 转表格", "报表转 Excel", "PDF 数据提取"],
    icon: "convert",
    processing: "cloud",
    availability: "ready",
    accepts: [".pdf"],
    cardTag: "MinerU 云端识别",
    usageSteps: [
      "上传含表格的 PDF 文件",
      "MinerU 云端识别表格，请保持页面打开",
      "逐表预览确认后下载 Excel 文件",
    ],
  },
  {
    slug: "invoice-print",
    category: "pdf",
    name: "发票拼版打印",
    shortName: "发票拼版",
    description: "多张发票 PDF 拼到 A4 一页打印，省纸省事。",
    longDescription:
      "报销前把一堆电子发票 PDF 拼到 A4 纸上：支持一页 1 / 2 / 4 张，自动等比缩放居中，可显示裁切参考线。全部在浏览器本地处理，发票不会上传。打印时选择「实际大小」，沿虚线裁开即可粘贴报销。",
    keywords: ["发票拼版", "发票打印", "电子发票合并打印", "发票排版", "A4 拼版打印", "报销发票打印"],
    icon: "printer",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
    usageSteps: [
      "选择多个发票 PDF 文件",
      "选择每张 A4 打印的张数",
      "生成拼版并下载，打印后沿虚线裁开",
    ],
  },
  {
    slug: "remove-bg",
    category: "image",
    name: "图片去背景",
    shortName: "图片去背景",
    description: "AI 一键抠图，输出透明背景 PNG。",
    longDescription:
      "上传人物、商品或物品照片，AI 模型自动识别主体并去除背景，输出透明背景 PNG，可直接用于海报、简历、电商详情。由服务器端开源模型 rembg（u2netp）处理，图片处理完立即删除。复杂毛发边缘可能需要手动微调。",
    keywords: ["图片去背景", "抠图", "透明背景", "一键抠图", "去背", "remove background"],
    icon: "scissors",
    processing: "cloud",
    availability: "ready",
    accepts: [".jpg", ".jpeg", ".png", ".webp"],
    cardTag: "AI 云端模型",
    usageSteps: [
      "选择 JPG / PNG / WebP 图片",
      "AI 模型自动识别主体并去除背景",
      "预览对比后下载透明 PNG",
    ],
  },
  {
    slug: "ebook-convert",
    category: "pdf",
    name: "电子书格式转换",
    shortName: "电子书转换",
    description: "EPUB、MOBI、AZW3 与 PDF、Word 互转。",
    longDescription:
      "上传 EPUB、MOBI、AZW3、PDF、Word、TXT、HTML 或 RTF，转换为 PDF、EPUB、Word、TXT、MOBI、AZW3 等格式，由服务器端 calibre 引擎完成，Kindle 和微信读书用户都适用。PDF 输出为 A4 页面，文件处理完立即删除。",
    keywords: ["电子书转换", "EPUB 转 PDF", "MOBI 转换", "AZW3 转换", "EPUB 转 Word", "calibre 在线"],
    icon: "book",
    processing: "cloud",
    availability: "ready",
    accepts: [".epub", ".mobi", ".azw3", ".pdf", ".docx", ".txt", ".html", ".rtf"],
    cardTag: "calibre 引擎",
    usageSteps: [
      "上传电子书或文档（EPUB / MOBI / PDF 等）",
      "选择目标格式（PDF / EPUB / Word / TXT / Kindle）",
      "转换完成后下载文件",
    ],
  },
  {
    slug: "pdf-metadata",
    category: "pdf",
    name: "PDF 元数据编辑",
    shortName: "PDF 元数据",
    description: "查看修改标题作者等信息，一键清痕迹。",
    longDescription:
      "查看并编辑 PDF 的标题、作者、主题、关键词、创建程序等信息，也可以一键清空生成软件痕迹后下载，适合对外分享前去除个人信息。全部在浏览器本地处理，文件不会上传。",
    keywords: ["PDF 元数据", "PDF 属性修改", "PDF 作者修改", "PDF 标题修改", "去除 PDF 信息", "PDF 信息查看"],
    icon: "tag",
    processing: "browser",
    availability: "ready",
    accepts: [".pdf"],
    usageSteps: [
      "上传 PDF 查看当前元数据",
      "编辑标题、作者等字段，或一键清空痕迹",
      "保存并下载新文件",
    ],
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
    slug: "markdown-preview",
    category: "create",
    name: "Markdown 预览",
    shortName: "Markdown 预览",
    description: "粘贴 Markdown 实时预览排版，并可下载 .md 文件。",
    longDescription:
      "把 Markdown 源码粘贴进来，右侧即时渲染出标题、列表、表格、代码块的真实排版效果，确认无误后下载 .md 文件留档或分享。渲染完全在浏览器本地完成，文字不上传；内嵌 HTML 会作为文字显示，不参与渲染。",
    keywords: ["Markdown 预览", "Markdown 在线预览", "Markdown 渲染", "md 文件下载", "Markdown 编辑器"],
    icon: "markdown",
    processing: "browser",
    availability: "ready",
    accepts: ["文本", ".md"],
    cardTag: "本地渲染 · 不上传",
    usageSteps: [
      "把 Markdown 源码粘贴到左侧输入框",
      "右侧即时预览标题、列表、表格与代码块排版",
      "确认后下载 .md 文件，或继续修改内容",
    ],
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
    slug: "lottery",
    category: "life",
    name: "抽奖 / 随机点名",
    shortName: "抽奖点名",
    description: "粘贴名单滚动抽奖，支持多轮不重复。",
    longDescription:
      "粘贴参与名单（支持换行、逗号、顿号分隔），设置每次抽取人数，滚动动画后公平抽出中奖者。中奖者自动移出奖池可连续抽多轮不重复，支持保留往轮记录与一键复制名单。抽奖使用加密级随机数，全部在浏览器本地完成。",
    keywords: ["在线抽奖", "随机点名", "名单抽奖", "年会抽奖", "抽奖工具", "抽人"],
    icon: "party",
    processing: "browser",
    availability: "ready",
    accepts: ["名单"],
    usageSteps: [
      "粘贴参与名单，选择每次抽取的人数",
      "点击开始抽奖，滚动停止后公布结果",
      "中奖者自动移出奖池，可继续抽取或复制名单",
    ],
  },
  {
    slug: "kinship",
    category: "life",
    name: "亲戚称呼计算器",
    shortName: "亲戚称呼",
    description: "点一点算出该怎么称呼，逢年过节不叫错。",
    longDescription:
      "点选“爸爸的哥哥”这类关系链，立即算出该叫什么（大爷 / 伯父）；也可以反过来输入称呼查TA和你的关系。支持按我的性别区分称呼口径，覆盖三代内直系与旁系，基于开源库 relationship.js 在浏览器本地计算。",
    keywords: ["亲戚称呼计算器", "亲戚关系计算", "怎么称呼", "叫什么", "过年亲戚称呼", "亲属关系"],
    icon: "users",
    processing: "browser",
    availability: "ready",
    accepts: ["称呼", "关系"],
    cardTag: "开源词库 · 本地计算",
    usageSteps: [
      "选择点选关系链或输入称呼两种方式",
      "点选称呼或输入如“舅公”“爸爸的姐姐的儿子”",
      "立即显示规范称呼与关系解释",
    ],
  },
  {
    slug: "marquee",
    category: "life",
    name: "滚动大字屏",
    shortName: "滚动字幕",
    description: "手机全屏滚动大字，接机叫号应援都能用。",
    longDescription:
      "输入一句话让手机变成 LED 大字屏：支持接机白底红字、车屏黑底黄字、荧光绿、素雅黑白四种配色，可向左/向右滚动或静止举牌（自动缩小字号保证一行放下）。全屏播放期间屏幕保持常亮，全部效果在浏览器本地生成。",
    keywords: ["滚动字幕", "LED 大字屏", "接机牌", "滚动大字", "手机弹字幕", "应援字幕"],
    icon: "screen",
    processing: "browser",
    availability: "ready",
    accepts: ["文字"],
    usageSteps: [
      "输入要显示的一句话，挑选配色与字号",
      "选择向左/向右滚动或静止举牌",
      "点击全屏播放，把手机横过来举高高",
    ],
  },
  {
    slug: "installment-apr",
    category: "life",
    name: "分期利率换算器",
    shortName: "分期利率",
    description: "月费率 0.6% 实际年化多少？一算吓一跳。",
    longDescription:
      "信用卡、花呗、白条分期宣传的『月手续费率』并不等于年利率：本金逐月归还，手续费却按全额收取。输入金额、期数与费率，用 IRR 算出真实年化利率，与房贷利率一比就知道分期有多贵。计算在浏览器本地完成。",
    keywords: ["分期利率计算", "实际年化利率", "IRR 计算器", "信用卡分期划算吗", "花呗分期利率", "月费率转年利率"],
    icon: "percent",
    processing: "browser",
    availability: "ready",
    accepts: ["数值"],
    usageSteps: [
      "输入分期金额与期数",
      "选择按月手续费率或按每月还款额",
      "实时看到真实年化利率与总手续费",
    ],
  },
  {
    slug: "iou-generator",
    category: "life",
    name: "借条生成器",
    shortName: "借条生成",
    description: "填空生成规范借条，欠钱不还也有据可依。",
    longDescription:
      "借钱最怕写错借条。填写双方信息、金额、日期与利率，自动生成包含法定要素的规范借条（金额大小写、利率红线提示、转账凭证条款），可下载图片打印后签名按手印。全部在浏览器本地生成，隐私不上传。",
    keywords: ["借条模板", "借条怎么写", "欠条生成器", "规范借条", "借款合同", "借钱凭证"],
    icon: "receipt",
    processing: "browser",
    availability: "ready",
    accepts: ["文本", "数值"],
    usageSteps: [
      "填写双方姓名、金额、日期与利率",
      "预览自动生成的规范借条",
      "下载图片打印，借款人当场签名按手印",
    ],
  },
  {
    slug: "severance-calculator",
    category: "life",
    name: "经济补偿金计算器",
    shortName: "补偿金计算",
    description: "被裁应得 N、N+1 还是 2N？输入即知。",
    longDescription:
      "按《劳动合同法》通行口径估算经济补偿：支持协商解除（N）、无过失辞退未提前通知（N+1）、违法解除（2N）与合同到期不续签四种情形，自动处理工龄折算与社平工资三倍封顶。计算在浏览器本地完成。",
    keywords: ["经济补偿金计算", "裁员赔偿 N+1", "2N 赔偿", "辞退补偿", "劳动法补偿", "被裁拿多少钱"],
    icon: "scale",
    processing: "browser",
    availability: "ready",
    accepts: ["日期", "数值"],
    usageSteps: [
      "选择离职情形（N / N+1 / 2N / 到期不续签）",
      "填写入职离职日期与月平均工资",
      "实时看到补偿金额与法定说明",
    ],
  },
  {
    slug: "period-tracker",
    category: "life",
    name: "经期 / 安全期记录",
    shortName: "经期记录",
    description: "记录经期、预测周期，数据只留在本机。",
    longDescription:
      "记录每次经期开始日，自动推算平均周期、预测下次经期、排卵日与易孕窗口，并以日历视图展示。所有数据仅保存在你自己的浏览器里，永不上传服务器。日历法受多种因素影响，不可作为避孕依据。",
    keywords: ["经期记录", "安全期计算器", "排卵日计算", "月经日历", "例假记录", "生理期 App"],
    icon: "calheart",
    processing: "browser",
    availability: "ready",
    accepts: ["日期"],
    cardTag: "隐私数据不出设备",
    usageSteps: [
      "添加每次经期开始日期",
      "自动预测下次经期、排卵日与易孕期",
      "日历视图直观查看，数据仅存本机",
    ],
  },
  {
    slug: "aa-settle",
    category: "life",
    name: "聚会 AA 结算器",
    shortName: "AA 结算",
    description: "谁垫了钱谁欠谁？最少转账次数结清。",
    longDescription:
      "聚会、旅游、合租分摊算不清？填写每人垫付的金额，自动按人均分摊，并给出最少转账次数的结清方案，一键复制发群里。金额用整数分计算避免浮点误差，全部在浏览器本地完成。",
    keywords: ["AA 记账", "聚会分摊", "旅游算账", "AA 结算", "转账计算", "多人分摊"],
    icon: "calculator",
    processing: "browser",
    availability: "ready",
    accepts: ["数值"],
    usageSteps: [
      "填写每人姓名与垫付金额",
      "自动算出人均与最少转账方案",
      "复制结算方案发到群里照着转",
    ],
  },
  {
    slug: "wifi-qrcode",
    category: "create",
    name: "WiFi 二维码",
    shortName: "WiFi 二维码",
    description: "填上 WiFi 名和密码，客人扫码直接连网。",
    longDescription:
      "输入 WiFi 名称与密码，生成标准的 WiFi 连接二维码：手机相机或微信扫一扫即可加入网络，不用再一个字一个字念密码。支持 WPA/WPA2、WEP 与开放网络，可标记隐藏网络。生成在浏览器本地完成，WiFi 密码不上传。",
    keywords: ["WiFi 二维码", "WiFi 连接码", "无线二维码", "客人连 WiFi", "路由器二维码", "扫码连网"],
    icon: "wifi",
    processing: "browser",
    availability: "ready",
    accepts: ["文本"],
    usageSteps: [
      "填写 WiFi 名称、密码与加密方式",
      "生成二维码并下载 PNG",
      "打印贴在前台或路由器旁，扫码即连",
    ],
  },
  {
    slug: "tts-reader",
    category: "create",
    name: "文章朗读器",
    shortName: "文章朗读",
    description: "粘贴文章读给你听，通勤路上解放双眼。",
    longDescription:
      "把文章、通知、公众号内容粘贴进来，浏览器语音合成直接朗读，支持语速调节、暂停继续与中文语音选择。朗读在浏览器本地完成，文字不上传。适合通勤听文、护眼听读与给老人读通知。",
    keywords: ["文章朗读", "文字转语音", "网页朗读", "听文章", "语音阅读", "TTS 在线"],
    icon: "volume",
    processing: "browser",
    availability: "ready",
    accepts: ["文本"],
    usageSteps: [
      "粘贴要朗读的文章",
      "选择语速与语音，点击开始朗读",
      "支持暂停、继续与停止",
    ],
  },
  {
    slug: "payslip-explain",
    category: "create",
    name: "工资条解读",
    shortName: "工资条解读",
    description: "到手为什么这么少？逐项讲明白。",
    longDescription:
      "把工资条各栏粘贴进来，AI 逐项解释每一栏是什么、为什么扣，核对社保公积金个税扣除是否在合理区间，并告诉你该问 HR 哪些问题。解读由 DeepSeek 在云端生成，仅供参考。",
    keywords: ["工资条解读", "工资计算", "社保扣款", "公积金个税", "到手工资", "看不懂工资条"],
    icon: "wallet",
    processing: "cloud",
    availability: "ready",
    accepts: ["文本"],
    headerTag: "AI 云端解读 · 内容将发送至 DeepSeek",
    cardTag: "AI 云端解读",
    usageSteps: [
      "把工资条各栏粘贴为文字（可拍照后用 OCR）",
      "填写所在城市帮助估算社保",
      "AI 逐项解读并指出异常扣款",
    ],
  },
  {
    slug: "checkup-explain",
    category: "create",
    name: "体检报告解读",
    shortName: "体检报告解读",
    description: "箭头上上下下，AI 帮你看懂每个指标。",
    longDescription:
      "粘贴体检报告的异常指标，AI 用大白话解释每个指标偏高偏低的常见原因、需要重视的程度排序、建议的复查项目，并提示需要尽快就医的警示信号。解读不构成医疗建议，请以医生诊断为准。",
    keywords: ["体检报告解读", "体检指标", "报告看不懂", "尿酸高怎么办", "体检异常", "指标解读"],
    icon: "pulse",
    processing: "cloud",
    availability: "ready",
    accepts: ["文本"],
    headerTag: "AI 云端解读 · 内容将发送至 DeepSeek",
    cardTag: "AI 云端解读",
    usageSteps: [
      "把体检报告指标粘贴为文字",
      "选填年龄性别等基本信息",
      "AI 按轻重排序解读并给复查建议",
    ],
  },
  {
    slug: "medication-guide",
    category: "create",
    name: "药品说明书大白话",
    shortName: "说明书大白话",
    description: "“一次 0.25g qid”翻译成人话。",
    longDescription:
      "把药品说明书粘贴进来，AI 转述成大白话：这个药治什么、怎么吃、饭前饭后、忘了吃怎么办、忌口与停药信号。严格基于说明书内容转述，不添加用药建议，请遵医嘱及说明书。",
    keywords: ["药品说明书", "用药说明", "药怎么吃", "饭前饭后", "说明书翻译", "用药指导"],
    icon: "pill",
    processing: "cloud",
    availability: "ready",
    accepts: ["文本"],
    headerTag: "AI 云端解读 · 内容将发送至 DeepSeek",
    cardTag: "AI 云端解读",
    usageSteps: [
      "粘贴或 OCR 药品说明书内容",
      "AI 转成大白话用法说明",
      "按医生医嘱与说明书用药",
    ],
  },
  {
    slug: "letter-draft",
    category: "create",
    name: "辞职信 / 投诉信生成器",
    shortName: "辞职投诉信",
    description: "把事实交给 AI，组织成得体的正式文书。",
    longDescription:
      "不知道怎么开口辞职、被坑了不会写投诉？把事实经过写清楚，AI 按你选择的语气（克制礼貌 / 正式规范 / 坚决明确）起草规范的辞职信或投诉信，事实诉求一目了然。内容由 DeepSeek 在云端生成，发送前请核对事实。",
    keywords: ["辞职信模板", "辞职信怎么写", "投诉信", "12345 投诉", "维权信", "离职申请"],
    icon: "mail",
    processing: "cloud",
    availability: "ready",
    accepts: ["文本"],
    headerTag: "AI 云端起草 · 内容将发送至 DeepSeek",
    cardTag: "AI 云端起草",
    usageSteps: [
      "选择辞职信或投诉信，写清事实经过",
      "选择语气与诉求",
      "AI 起草后复制发送，记得核对事实",
    ],
  },
  {
    slug: "hanzi-stroke",
    category: "life",
    name: "汉字笔顺学习",
    shortName: "笔顺学字",
    description: "说话查字看笔顺、练描红，AI 讲字义。",
    longDescription:
      "碰到不认识的字？按住麦克风说一个词（如“节约的约”），点选要学的字：田字格里逐笔演示笔顺动画，还能用手指跟着描红（写错顺序会提醒）。AI 老师用小学生听得懂的话讲字义、组词、例句和记忆口诀。学过的字自动记在本机。",
    keywords: ["笔顺", "汉字笔顺", "笔顺动画", "识字", "学写字", "描红", "儿童识字", "字义"],
    icon: "brush",
    processing: "cloud",
    availability: "ready",
    accepts: ["语音", "汉字"],
    headerTag: "笔顺本地动画 · 字义由 DeepSeek 生成",
    cardTag: "笔顺动画 · AI 字义",
    usageSteps: [
      "按住麦克风说出词语，或直接输入汉字",
      "点选要学的字，看田字格里的笔顺动画",
      "切换描红练习跟着写，AI 老师讲字义和口诀",
    ],
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
