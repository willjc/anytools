# 万用工具箱

一个在线工具站。多数工具在浏览器本地完成处理，文件不离开设备；标注「云端处理」的功能由服务器即时处理后即删。

「随手传」是云端保存工具，规则不同：文字和文件默认保存 3 年，用户可提前删除。当前注册表共 56 个工具，以 `src/lib/tools.ts` 为准。

## 随手传

入口 `/tools/transfer`。用户名和密码登录，跨设备保存文字、任意格式文件；单文件最大 1 GiB（页面显示 1 GB），无账号总容量配额。使用 8 MiB 分块和 SHA-256 完整校验，重新选择同一内容文件可续传；未完成上传保留 7 天。分享默认 7 天，可选 1/7/30/365 天和提取码，撤销或重新生成后旧链接立即失效。

- Node 24 内置 SQLite 保存账号、会话和记录；密码用随机盐 scrypt，Cookie 为 HttpOnly。`@noble/hashes` 用于 HTTP 浏览器环境下的增量文件校验。
- 数据在 Compose 命名卷 `alltools_transfer_data`，挂载 `/data/transfer`，与不可变发布目录独立。不要执行 `docker compose down --volumes`。
- 非 Docker 开发默认存 `.transfer-data`，可用 `TRANSFER_DATA_DIR` 指定。数据目录已排除 Git、Docker 构建和发布上传。
- `transfer-maintenance` 每小时清理到期内容和临时上传、每日生成备份，保留近 7 天快照。数据库使用 SQLite backup API，已完成文件用硬链接备份；文件完成后不再修改。只有存在 `complete.json` 的快照可用于恢复。
- 备份位于同一数据卷的 `backups/YYYY-MM-DD`，支持误删除恢复，但不防整机/硬盘损坏；异机备份需要另行提供备份目的地。删除的内容可能在近期备份中最多保留 7 天。
- 恢复时先停止 app 和 maintenance，对现有卷另作备份，将选定快照的 `transfer.sqlite` 和 `files/` 复制至一个新的独立卷（不要把数据库硬链接回运行目录），验证 `PRAGMA integrity_check` 后切换卷并启动。恢复不保留登录会话，用户重新登录。
- 可手动执行 `docker exec alltools-transfer-maintenance-1 node scripts/transfer-maintenance.mjs --once`，检查备份完成记录与容器日志。无每日完成记录说明备份未成功，不能据此承诺可恢复。
- 剩余空间低于 5 GiB 时拒绝新建内容；预留未完成上传的空间。主域名 `tools.duwu.me` 经 Cloudflare Tunnel 提供 HTTPS，直连 `http://<服务器>:9999` 仍是未加密 HTTP，页面在非 HTTPS 环境下明确提示。

已开放 56 个工具。

PDF 17 个：拆分 / 合并 / 页面整理 / 加水印 / 加页码 / 改字 / 压缩（云端）/ 转 Word（云端）/ 转图片 / 图片转 PDF / Word 转 PDF（云端）/ 加密与解锁（云端）/ 转 Excel（云端）/ 发票拼版打印 / 电子书格式转换（云端）/ 元数据编辑 / 签名盖章。

图片 10 个：压缩 / 格式转换 / 裁剪 / 加水印 / 拼接 / 九宫格切图 / HEIC 转 JPG（云端）/ 改尺寸 / 隐私遮挡 / 图片转文字（云端）。

生成 8 个：二维码生成 / WiFi 二维码 / 文本整理与字数统计 / Markdown 导出（云端）/ Markdown 预览 / 文档转 Markdown（云端）/ 文字长图生成器 / 文章朗读器。

音视频 5 个（均云端）：视频压缩 / 视频提取音频 / 音频格式转换 / 视频转 GIF / GIF 压缩。

生活 13 个：单位换算 / 日期计算 / 人民币大写 / 房贷计算器 / 抽奖点名 / 亲戚称呼 / 滚动大字屏 / 分期利率换算 / 借条生成 / 经济补偿金 / 经期记录 / 聚会 AA 结算 / 汉字笔顺。

网络 2 个：IP 查询（云端）与随手传（云端保存）。

## 本地开发

```bash
cp .env.example .env.local
npm ci
npm run dev
```

提交前请按顺序运行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 生产部署

`NEXT_PUBLIC_SITE_URL` 会在构建时写入 SEO 元数据、canonical、sitemap，因此必须填写外部访问地址。

```bash
cp .env.example .env
# 编辑 .env 中的 NEXT_PUBLIC_SITE_URL，例如 http://36.133.40.235:9999
docker compose --env-file .env up --build
```

服务默认监听 `0.0.0.0:9999`，健康检查在容器内访问首页。生产环境使用只读根文件系统、无 Linux capabilities 的非 root Node 进程。

### Cloudflare Tunnel（tools.duwu.me）

生产主域名走 Cloudflare Tunnel，不经公网开放端口：

- Cloudflare 侧：隧道 `alltools-production`（远程管理模式），ingress 将 `tools.duwu.me` 转发到 `http://127.0.0.1:8081`；DNS 为指向 `<隧道ID>.cfargotunnel.com` 的橙云 CNAME。
- 连接器 `cloudflared` 与 `tunnel-gateway`（Caddy）共享网络命名空间：Caddy 只绑定回环 `127.0.0.1:8081`，端口不发布到宿主机；连接器用 token 文件认证。两个服务由 `COMPOSE_PROFILES=tunnel` 启用（见 `compose.yaml` 的 tunnel profile）。
- `tunnel-gateway` 读取 `deploy/Caddyfile.tunnel`：仅接受 `Host: tools.duwu.me` 且带 `CF-Connecting-IP` 的请求，覆写 `X-Suishou-Client-IP` / `X-Forwarded-For` / `X-Real-IP` 为 Cloudflare 提供的访客 IP，并设置 `X-Forwarded-Proto: https`。`CF-Connecting-IP` 只是地址信息、不是认证；信任边界是回环绑定加网络隔离，因此 8081 绝不能发布到宿主机，否则任何直连进程都能伪造该头。
- 服务器端凭据 `/etc/alltools/cloudflared.token`（root 属主、组 65532、640 权限），内容为隧道 token，不得提交或写入日志。
- 原 `9999` 直连入口保留（应急与内网使用），其 Caddy 继续以直连对端地址覆写客户端 IP 头，不信任访客自带的 Cloudflare 头。
- Cloudflare 代理对单请求体与总时长有平台限制（免费版上传体 100 MiB），大文件上传、长时媒体处理可能受影响；超限时优先使用 9999 直连入口。

启用步骤：在 `/etc/alltools/alltools.env` 设置 `COMPOSE_PROFILES=tunnel`、`NEXT_PUBLIC_SITE_URL=https://tools.duwu.me`、`NEXT_PUBLIC_PRIVATE_QUERY_URL=https://tools.duwu.me/private-query`，写入 token 文件后 `docker compose --profile tunnel up -d cloudflared tunnel-gateway`。回滚到旧版本会移除 tunnel profile 的两个容器，主域名将不可达，需回滚 Cloudflare DNS 或恢复 profile。

### 云端工具依赖

云端工具在容器内调用以下系统组件（镜像均已安装）：`qpdf`（PDF 加密/轻度压缩）、`ghostscript`（PDF 压缩的图片降采样重编码）、`ffmpeg`（视频压缩、提取音频、音频转换）、`libreoffice-writer` + `fonts-noto-cjk`（PDF / Word 转换）、`heif-convert`（HEIC 转换）、`calibre`（电子书格式转换）。可通过 `ALLTOOLS_MAX_UPLOAD_MB` 控制上传大小上限（默认 100）。依赖缺失时对应接口返回 503，页面提示服务暂不可用；媒体类处理超时上限 10 分钟。

云端识别还依赖两个外部服务：

- **MinerU API**（`MINERU_API_TOKEN`，可选）：图片转文字与文档转 Markdown；未配置时对应接口返回 503。
- **ASR 微服务**（`ALLTOOLS_ASR_URL`，compose 内默认 `http://asr:8000`）：`asr/main.py` 用 faster-whisper（CPU int8，`ASR_MODEL_SIZE` 默认 `base`）为汉字笔顺工具的语音输入做转写；模型首次启动从 HF 镜像下载到命名卷 `asr-models`。未配置时语音录入不可用，可改为手动输入文字。

`DEEPSEEK_API_KEY`（可选）供汉字笔顺的 AI 字义讲解使用，按 IP 每日限额（`ALLTOOLS_AI_DAILY_LIMIT`）；未配置时讲解功能返回 503，不影响其他工具。

## CI/CD

GitHub Actions 分为两段：PR 与推送 `main` 会运行验证；通过验证并推送到 `main` 后，生产部署工作流会上传不可变的 Git SHA 发布目录，并由服务器脚本构建、健康检查、切换当前版本。健康检查失败时会尝试恢复上一个已标记为 current 的版本。

在 GitHub 仓库的 `production` Environment 中设置：

- Variables：`DEPLOY_HOST=36.133.40.235`、`DEPLOY_PORT=3322`
- Secret：`DEPLOY_SSH_PRIVATE_KEY`（仅限 `ci-deploy` 用户的专用私钥）

服务器端还需要：

- `/etc/alltools/alltools.env`：包含 `NEXT_PUBLIC_SITE_URL`、`ALLTOOLS_BIND_ADDRESS`、`ALLTOOLS_PORT`；启用隧道时另有 `COMPOSE_PROFILES=tunnel` 与 `/etc/alltools/cloudflared.token`
- `/usr/local/sbin/alltools-deploy`：根用户拥有、仅允许 `ci-deploy` 免密 sudo 调用
- `/opt/alltools/releases`：仅供 `ci-deploy` 上传发布文件

部署前要将服务器 SSH 主机公钥写进 [deploy/known_hosts](deploy/known_hosts)，避免 CI 首次连接时信任未知主机。

## 后续一次性支付

`src/lib/billing/contracts.ts` 定义了一次性支付的订单、金额、checkout 与回调校验接口。它不含任何商户密钥、支付实现或假支付按钮；接入支付宝、微信支付等服务商时，应实现 `OneTimePaymentProvider`、持久化订单并校验回调签名后再交付付费结果。
