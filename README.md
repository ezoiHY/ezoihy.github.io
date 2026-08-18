# Ezoihy's Blog

一个使用 Astro 与 GitHub Pages 构建的个人博客，包含文章、项目、关于页面、RSS、站点地图和自动明暗主题。

## 本地运行

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:4321`。

## 写一篇新文章

在 `src/data/blog/` 中新建 Markdown 文件，并添加：

```md
---
title: "文章标题"
description: "文章摘要"
pubDate: 2026-08-18
tags: ["标签"]
draft: false
---

正文从这里开始。
```

将 `draft` 设为 `true` 可暂时隐藏文章。

## 发布到 GitHub Pages

1. 在 GitHub 创建名为 `ezoihy.github.io` 的公开仓库。
2. 将本项目推送到仓库的 `main` 分支（使用 `master` 也可以）。
3. 打开仓库的 **Settings → Pages**，将 **Source** 设为 **GitHub Actions**。
4. 等待 Actions 完成，访问 <https://ezoihy.github.io>。

推送到 `main` 或 `master` 分支后，`.github/workflows/deploy.yml` 会自动构建和发布博客。
