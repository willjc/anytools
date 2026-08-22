# 万用工具箱

面向中文用户的在线文件处理工具平台。首版中的文件处理在浏览器本地完成，不上传用户文件；服务端专注于 SEO 页面、后续账号、订单和异步任务能力。

## 本地运行

```bash
cp .env.example .env.local
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 质量检查

每次提交和部署前运行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 生产部署

项目使用 Next.js standalone 输出，后续通过 Docker Compose 在服务器隔离部署。CI 流水线与部署账户将在项目工具页完成并验证后配置；绝不复用服务器运维账户密钥。
