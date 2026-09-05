# 万用工具箱

一个在线工具站。多数工具在浏览器本地完成处理，文件不离开设备；标注「云端处理」的功能由服务器即时处理后即删。

「随手传」是云端保存工具，规则不同：文字和文件默认保存 3 年，用户可提前删除。当前注册表共 39 个工具，以 `src/lib/tools.ts` 为准。

## 随手传

入口 `/tools/transfer`。用户名和密码登录，跨设备保存文字、任意格式文件；单文件最大 1 GiB（页面显示 1 GB），无账号总容量配额。使用 8 MiB 分块和 SHA-256 完整校验，重新选择同一内容文件可续传；未完成上传保留 7 天。分享默认 7 天，可选 1/7/30/365 天和提取码，撤销或重新生成后旧链接立即失效。

- Node 24 内置 SQLite 保存账号、会话和记录；密码用随机盐 scrypt，Cookie 为 HttpOnly。`@noble/hashes` 用于 HTTP 浏览器环境下的增量文件校验。
- 数据在 Compose 命名卷 `alltools_transfer_data`，挂载 `/data/transfer`，与不可变发布目录独立。不要执行 `docker compose down --volumes`。
- 非 Docker 开发默认存 `.transfer-data`，可用 `TRANSFER_DATA_DIR` 指定。数据目录已排除 Git、Docker 构建和发布上传。
- `transfer-maintenance` 每小时清理到期内容和临时上传、每日生成备份，保留近 7 天快照。数据库使用 SQLite backup API，已完成文件用硬链接备份；文件完成后不再修改。只有存在 `complete.json` 的快照可用于恢复。
- 备份位于同一数据卷的 `backups/YYYY-MM-DD`，支持误删除恢复，但不防整机/硬盘损坏；异机备份需要另行提供备份目的地。删除的内容可能在近期备份中最多保留 7 天。
- 恢复时先停止 app 和 maintenance，对现有卷另作备份，将选定快照的 `transfer.sqlite` 和 `files/` 复制至一个新的独立卷（不要把数据库硬链接回运行目录），验证 `PRAGMA integrity_check` 后切换卷并启动。恢复不保留登录会话，用户重新登录。
- 可手动执行 `docker exec alltools-transfer-maintenance-1 node scripts/transfer-maintenance.mjs --once`，检查备份完成记录与容器日志。无每日完成记录说明备份未成功，不能据此承诺可恢复。
- 剩余空间低于 5 GiB 时拒绝新建内容；预留未完成上传的空间。现有 HTTP/IP 入口仍使用未加密传输，页面明确提示；并未配置或宣称 HTTPS。

已开放 33 个工具：PDF 拆分 / 合并 / 页面整理 / 加水印 / 加页码 / 改字 / 压缩（云端）/ 转 Word（云端）/ 转图片 / 图片转 PDF / Word 转 PDF（云端）/ 签名盖章，图片压缩 / 格式转换 / 裁剪 / 加水印 / 拼接 / 九宫格切图 / HEIC 转 JPG（云端）/ 改尺寸 / 隐私遮挡，二维码生成 / 文本整理与字数统计 / Markdown 导出 / 文档转 Markdown（云端），视频压缩 / 视频提取音频 / 音频格式转换（均云端），IP 查询（访客 IP 与域名解析，云端），以及单位换算 / 日期计算 / 人民币大写 / 房贷计算器四个生活工具。

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

### 云端工具依赖

云端工具在容器内调用以下系统组件（镜像均已安装）：`qpdf`（PDF 压缩）、`ffmpeg`（视频压缩、提取音频、音频转换）、`libreoffice-writer` + `fonts-noto-cjk`（PDF / Word 转换）、`heif-convert`（HEIC 转换）。可通过 `ALLTOOLS_MAX_UPLOAD_MB` 控制上传大小上限（默认 100）。依赖缺失时对应接口返回 503，页面提示服务暂不可用；媒体类处理超时上限 10 分钟。

## CI/CD

GitHub Actions 分为两段：PR 与推送 `main` 会运行验证；通过验证并推送到 `main` 后，生产部署工作流会上传不可变的 Git SHA 发布目录，并由服务器脚本构建、健康检查、切换当前版本。健康检查失败时会尝试恢复上一个已标记为 current 的版本。

在 GitHub 仓库的 `production` Environment 中设置：

- Variables：`DEPLOY_HOST=36.133.40.235`、`DEPLOY_PORT=3322`
- Secret：`DEPLOY_SSH_PRIVATE_KEY`（仅限 `ci-deploy` 用户的专用私钥）

服务器端还需要：

- `/etc/alltools/alltools.env`：包含 `NEXT_PUBLIC_SITE_URL`、`ALLTOOLS_BIND_ADDRESS`、`ALLTOOLS_PORT`
- `/usr/local/sbin/alltools-deploy`：根用户拥有、仅允许 `ci-deploy` 免密 sudo 调用
- `/opt/alltools/releases`：仅供 `ci-deploy` 上传发布文件

部署前要将服务器 SSH 主机公钥写进 [deploy/known_hosts](deploy/known_hosts)，避免 CI 首次连接时信任未知主机。

## 后续一次性支付

`src/lib/billing/contracts.ts` 定义了一次性支付的订单、金额、checkout 与回调校验接口。它不含任何商户密钥、支付实现或假支付按钮；接入支付宝、微信支付等服务商时，应实现 `OneTimePaymentProvider`、持久化订单并校验回调签名后再交付付费结果。
