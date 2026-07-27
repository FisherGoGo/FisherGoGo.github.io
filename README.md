# FisherGoGo Fuwari Blog

这是 Fisher 博客的 Fuwari / Astro 迁移版本。当前版本已迁移原 Hexo 博客中的 36 篇文章、9 个分类、标签和本地图片资源。

## 已完成

- 中文界面、个人信息、头像与横幅定制
- 文章、分类和标签迁移
- KaTeX 数学公式与代码高亮
- 首页、归档、文章目录和关于页面
- 原 Hexo 日期链接的兼容跳转
- GitHub Pages 自动部署工作流

## 本地运行

需要 Node.js 20+ 和 pnpm 9+。

```sh
pnpm install
pnpm dev
```

浏览器访问 `http://localhost:4321/`。

## 构建检查

```sh
pnpm check
pnpm build
```

构建结果位于 `dist/`。

## 内容位置

- 文章：`src/content/posts/`
- 站点配置：`src/config.ts`
- 文章目录：`src/pages/directory.astro`
- 关于页面：`src/content/spec/about.md`
- 图片：`public/assets/` 和 `public/images/`

## 部署

项目包含 `.github/workflows/deploy.yml`。推送到个人 GitHub 仓库的 `main` 分支后，在仓库 Pages 设置中选择 GitHub Actions，即可自动构建和发布。

本项目基于 [saicaca/fuwari](https://github.com/saicaca/fuwari)，遵循其 MIT 许可证。
