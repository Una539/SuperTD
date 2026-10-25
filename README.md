# SuperTD

塔防游戏项目。`src/` 为 Zig 工程源码，`prototype/` 为可独立运行的网页原型 Demo。

## 本地打开 Demo

在项目根目录运行 `python3 -m http.server 8080 --directory prototype`，访问 http://localhost:8080/ 。无需安装依赖。玩法和配置说明见 [prototype/README.md](prototype/README.md)。

## GitHub Pages 部署

线上 Demo：https://supertd.unoflow.org/ 。域名由 Cloudflare 管理，`supertd` 的 DNS-only CNAME 指向 `una539.github.io`；GitHub Pages 的 Custom domain 设置为 `supertd.unoflow.org`。

在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。

推送到 `main` 且修改了 `prototype/` 或 `.github/workflows/deploy-demo.yml` 时，自动部署原型；也可以在 Actions 中手动运行 **Deploy prototype demo**。

工作流仅发布 Demo 的 HTML、CSS、JavaScript、图片及资源配置，不构建或部署 Zig 工程，也不发布测试或 Markdown 文档。网站地址可在成功部署的 Actions 记录或 Pages 设置中查看。

按当前开发约定，不自动运行原型测试或试玩，由用户手动验证。
