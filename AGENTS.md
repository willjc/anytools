<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-agent-rules -->

# 设计规范(必读)

任何 UI / 样式 / 新页面的改动,必须先阅读仓库根目录的 `DESIGN.md`(暖纸感画布 + 翡翠主色 + 暖中性色阶,slate 色阶已在 `globals.css` 中整体重映射)。新增工具只改 `src/lib/tools.ts` + workbench 组件,样式类名复用 DESIGN.md 第 4 节的组合,禁止引入色板之外的品牌色。

<!-- END:design-agent-rules -->

<!-- BEGIN:deploy-agent-rules -->

# 发布与服务器运维(必读)

## 发布流程

- 推送 `main` 即发布:GitHub Actions 先跑 `Verify`(lint / typecheck / test / build),通过后 `Deploy production` 把不可变的 Git SHA 发布目录 rsync 到服务器 `/opt/alltools/releases/<sha>`,再用 `sudo /usr/local/sbin/alltools-deploy <sha>` 构建、健康检查、切换 `/opt/alltools/current`。健康检查失败会自动回滚到上一个 current。
- CI 的 `npm run lint` 对**整个工作区**生效,会扫到未跟踪目录。本地 `sand-assault/` 是无关的 Vite 实验项目,已在 `.gitignore` 和 `eslint.config.mjs` 中忽略——不要把它的构建产物提交进来,否则 lint 会红、发布被卡。

## 关键陷阱:服务器上的部署脚本不会自动更新

- `deploy/alltools-deploy`(仓库)与 `/usr/local/sbin/alltools-deploy`(服务器,root:root 755)是**两份独立文件**,rsync 不会同步它。
- 改了 `deploy/alltools-deploy`(比如增删 compose 服务、调整健康门控的 `services=(...)`)后,**必须手动同步到服务器**,否则下次发布会因脚本与 compose.yaml 不一致而失败(曾出现 `no such service: rembg` 导致 deploy 红)。
- 同步方法:
  ```bash
  scp deploy/alltools-deploy alltools-1panel-prod:/tmp/alltools-deploy.new
  ssh alltools-1panel-prod 'bash -n /tmp/alltools-deploy.new \
    && sudo -n install -o root -g root -m 755 /tmp/alltools-deploy.new /usr/local/sbin/alltools-deploy \
    && rm -f /tmp/alltools-deploy.new'
  ```

## 服务器登录(本地已配好密钥)

- 日常管理:`ssh alltools-1panel-prod`(见 `~/.ssh/config`),ops 用户,密钥 `~/.ssh/alltools-ops-36-133-40-235`,`sudo -n` 免密可用,可操作 docker、改部署脚本。
- CI 专用:`ci-deploy` 用户,密钥 `~/.ssh/alltools-ci-deploy`,仅用于 Actions,权限受限,不要用它做日常操作。
- 常用排查:
  ```bash
  ssh alltools-1panel-prod 'sudo -n docker ps --format "{{.Names}}\t{{.Status}}"'   # 容器状态
  ssh alltools-1panel-prod 'sudo -n readlink -f /opt/alltools/current'              # 当前版本
  ssh alltools-1panel-prod 'sudo -n docker logs --tail 100 alltools-app-1'          # 应用日志
  ```

## 后台微服务

- `asr`(faster-whisper,CPU int8):汉字笔顺的语音录入转写,compose 内 `http://asr:8000`,模型首次启动下载到 `asr-models` 卷。已纳入部署健康门控。
- 2026-09-19 已下线 `rembg` 去背景微服务(代码、compose 服务、部署门控、旧镜像均已移除)。

<!-- END:deploy-agent-rules -->

