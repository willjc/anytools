<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-agent-rules -->

# 设计规范(必读)

任何 UI / 样式 / 新页面的改动,必须先阅读仓库根目录的 `DESIGN.md`(暖纸感画布 + 翡翠主色 + 暖中性色阶,slate 色阶已在 `globals.css` 中整体重映射)。新增工具只改 `src/lib/tools.ts` + workbench 组件,样式类名复用 DESIGN.md 第 4 节的组合,禁止引入色板之外的品牌色。

<!-- END:design-agent-rules -->
