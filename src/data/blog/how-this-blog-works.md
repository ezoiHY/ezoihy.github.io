---
title: "这个博客是怎样工作的"
description: "用简洁的方式理解 Markdown、Astro 与 GitHub Pages 如何组成一个自动发布的个人博客。"
pubDate: 2026-08-17
tags: ["Astro", "GitHub Pages", "建站"]
draft: false
---

这个博客使用 Astro 生成静态网页，并托管在 GitHub Pages 上。它没有数据库，也不需要长期运行的服务器。

## 写学习笔记

学习笔记保存在 `src/data/blog` 目录中，每篇笔记都是一个 Markdown 文件。文件开头的区域负责保存标题、发布日期、摘要和标签：

```md
---
title: "学习笔记标题"
description: "一句话摘要"
pubDate: 2026-08-18
tags: ["笔记"]
draft: false
---
```

在这段信息之后，就可以使用普通 Markdown 编写正文。

## 自动生成页面

Astro 在构建时读取所有公开学习笔记，为每篇笔记生成独立页面，同时更新首页、学习笔记列表、RSS 和站点地图。

## 自动发布

代码推送到 GitHub 后，GitHub Actions 会执行构建并把生成结果发布到 GitHub Pages。以后发布新学习笔记的基本流程只有三步：

1. 新建 Markdown 文件；
2. 完成学习笔记内容；
3. 提交并推送到 GitHub。

这套结构足够简单，也保留了以后继续扩展分类、评论、搜索和独立域名的空间。
