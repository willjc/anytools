# DESIGN.md —— 万用工具箱设计规范

> 本文件是全站唯一视觉规范。任何 AI 编程 agent / 开发者在为本项目新增页面、组件或调整样式前,必须先阅读并遵循本文件。
> 设计基调:**暖纸感画布 + 炭墨文字 + 翡翠主色**。目标观感:干净、温和、可信,像一本摊开的笔记本来处理文件。

## 1. 视觉主题与氛围

- **气质**:温和、轻盈、有纸感。不是科技感的冷峻,而是"打开一本干净笔记本能马上办事"的亲切。
- **画布**:全局使用暖纸色 `#faf9f6`,内容承载在纯白 `#ffffff` 卡片上,靠暖色发丝线分隔,而不是重边框。
- **主色**:翡翠绿(emerald),代表"本地处理、安全、即时"。云端处理功能统一用天蓝(sky)标注。
- **明暗**:仅浅色主题,无暗色模式。
- **圆角语言**:大面圆角——控件 `rounded-xl`,卡片 `rounded-3xl`,工作区容器 `rounded-[2rem]`,胶囊标签 `rounded-full`。禁止直角卡片。

## 2. 色彩体系与角色

### 中性色(暖灰阶)

中性色通过 `globals.css` 的 `@theme` **整体重映射 Tailwind 的 slate 色阶**实现,代码中照常写 `slate-*` 类即可:

| Token | 值 | 角色 |
|---|---|---|
| `slate-50` | `#fafaf9` | 输入框底、浅色填充 |
| `slate-100` | `#f1efec` | 徽章底、细分隔底色 |
| `slate-200` | `#e7e4df` | 发丝线、边框 |
| `slate-300` | `#d4d0c9` | 禁用边框 |
| `slate-400` | `#a5a199` | 占位文字、次要图标 |
| `slate-500` | `#7c7973` | 辅助说明文字 |
| `slate-600` | `#5f5d56` | 正文次要 |
| `slate-700` | `#47453f` | 正文 |
| `slate-900` | `#21201c` | 标题、深色按钮底 |
| `slate-950` | `#151412` | 最深墨色 |

### 画布与品牌色

| Token | 值 | 角色 |
|---|---|---|
| 画布 | `#faf9f6` | 全局背景(`--background`) |
| 卡片 | `#ffffff` | 一切内容卡片 |
| 主色 | emerald-600/700 (Tailwind) | 主按钮、链接、本地处理标识 |
| 云端标识 | sky-700 | 「云端处理」标签与说明 |
| 待上线 | amber-700 | 「即将上线」标签 |

### 分类色板(淡彩,Notion 式)

用于首页工具卡片图标章与分类标识,**按 tool.category 取色**:

| 分类 | 底色 | 图标文字 |
|---|---|---|
| pdf | `#d9f3e1` 薄荷 | emerald-800 |
| image | `#dcecfa` 天蓝 | sky-800 |
| create | `#fef7d6` 淡黄 | amber-800 |
| av | `#e6e0f5` 淡紫 | violet-800 |
| life | `#ffe8d4` 蜜桃 | orange-800 |
| network | `#d7f0ee` 青绿 | teal-800 |

## 3. 字体规则

- 字族:Geist Sans(已加载)→ 系统栈 → `"PingFang SC" → "Hiragino Sans GB" → "Microsoft YaHei"`。**不要**写裸 `Arial` / `sans-serif` 开头。
- 中文为主,标题用 `tracking-tight` 收紧;正文 `leading-6`/`leading-7` 保证呼吸感。
- 层级:页面 H1 `text-4xl sm:text-5xl font-semibold tracking-[-0.045em]`;区块 H2 `text-3xl`;卡片标题 `text-lg font-semibold tracking-tight`;辅助文字 `text-sm text-slate-600`;说明/法律条文 `text-xs text-slate-500`。

## 4. 组件样式

- **主按钮**:`rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed`,内含 lucide 图标 `size-4`。
- **次按钮/输入框**:`rounded-xl border border-slate-300 bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100`。
- **滑杆**:`accent-emerald-700`。
- **卡片**:白底 + `border-slate-200/90` + `shadow-card`,悬浮 `hover:shadow-lift` + 轻微上移。
- **工作区容器**(每个工具页的操作区):`rounded-[2rem] border border-slate-200 bg-white shadow-lift`。
- **消息横幅**(每个工具页底部的操作反馈):`rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-950`,带 `aria-live="polite"`;错误用 red-50/red-800。
- **标签**:处理方式标签统一放卡片/工作区右上角:本地=`浏览器本地处理`(emerald),云端=`云端处理 · 即时删除`(sky),未上线=`即将上线`(amber)。
- **图标**:统一 lucide-react,`strokeWidth=1.8`(ToolIcon 组件已封装),尺寸 `size-4`~`size-6`。

## 5. 布局原则

- 页面容器:`max-w-7xl mx-auto px-5 sm:px-8`(首页)/ `max-w-5xl`(工具详情)。
- 工作区内部:左右分栏 `grid lg:grid-cols-[1fr_0.55fr~0.85fr] gap-6`,窄屏自动堆叠。
- 区块间距:超大留白 `py-16 sm:py-24`(首页区块),组件间 `space-y-4~6`。
- 工具页固定结构:返回链接 → 分类 eyebrow(`tracking-[0.16em]` 小字)→ H1 → 长描述 → 工作区 → 「如何使用」三步卡。

## 6. 深度与海拔

只用三级,定义在 `globals.css @theme`:

| Token | 用途 |
|---|---|
| `shadow-card` | 卡片静置(极轻,几乎贴地) |
| `shadow-lift` | 卡片悬浮 / 工作区容器 |
| 环境阴影 | 首页 hero 装饰卡可用大扩散暖影 `rgba(28,25,23,…)`,禁止冷蓝 `rgba(15,23,42,…)` |

边框优先于阴影表达结构;阴影只用于"可点/可浮"的暗示。

## 7. 设计规范与禁忌

✅ 应该:新组件复用上述类名组合;新工具接入 `tools.ts` 自动获得规范;反馈一律走底部消息横幅;空态/禁用态必须给出下一步指引文案。

❌ 禁止:引入新的品牌色相(紫/粉仅限分类色板);使用冷灰(blue-gray/slate 默认值);直角容器;没有 `aria-live` 的静默报错;把「云端处理」标成绿色;硬编码字体名覆盖字族栈。

## 8. 响应式行为

- 断点:移动优先,主要断点 `sm(640) / lg(1024)`。
- 移动端:工具页分栏纵向堆叠;工作区内三列选项组 `sm:grid-cols-3` 堆叠;触控目标最小 `py-3`(≈44px)。
- 首页工具卡片网格:`md:grid-cols-2 xl:grid-cols-3`。

## 9. Agent 提示指南

给 agent 的速查:

- 主色 `emerald-700`,画布 `#faf9f6`,发丝线 `slate-200`(暖),墨色 `slate-950`(暖)。
- 新增工具 = 只改 `src/lib/tools.ts`(自动获得页面/首页/站点地图)+ 一个 workbench 组件 + 在 `tool-workbench.tsx` 加分发。
- 现成 prompt:

```text
参照根目录 DESIGN.md,为「<工具名>」创建工作区组件:
- 沿用现有 workbench 的分区结构(头部说明条 + 左右分栏 + 底部消息横幅)
- 主按钮 emerald-700,云端类工具标识用 sky-700
- 所有反馈写入 aria-live 横幅
```
