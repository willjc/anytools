# 万用工具箱

一个在线工具站。多数工具在浏览器本地完成处理，文件不离开设备；标注「云端处理」的功能由服务器即时处理后即删。

已开放 14 个工具：PDF 拆分 / 合并 / 页面整理 / 加水印 / 加页码 / 改字 / 压缩（云端），图片压缩 / 格式转换 / 裁剪 / 加水印 / 拼接 / 九宫格切图，二维码生成，以及单位换算、日期计算、人民币大写、房贷计算器四个生活工具。PDF 转 Word、HEIC 转换、AI 抠图、音视频处理等 6 个云端工具页面上线中，会按批次激活。

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

「PDF 压缩」在容器内调用 `qpdf`（镜像已安装）。可通过 `ALLTOOLS_MAX_UPLOAD_MB` 控制上传大小上限（默认 100）。其余云端工具上线时会在此列出各自的系统依赖；未安装依赖时对应接口返回 503，页面提示服务暂不可用。

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
