---
layout: post
title: How this blog worked
description: Looking back at the first version of my blog, built with Markdown, Astro, and GitHub Pages.
date: 2026-08-17
categories: [Build Log]
tags: [Astro, GitHub Pages, Web Development]
permalink: /posts/how-this-blog-works/
---

> Version note: This post documents the first Astro-based blog from August 2026. The current site has since migrated to Jekyll with al-folio. I have kept this post as a record of the original setup; the directories and commands below do not apply to the current version.

The first version used Astro to generate static pages hosted on GitHub Pages. It had no database and did not need a continuously running server.

## Writing notes

In that version, notes lived in `src/data/blog`, with one Markdown file per post. The front matter at the beginning of each file stored its title, publication date, summary, and tags:

```md
---
title: "Note title"
description: "A one-sentence summary"
pubDate: 2026-08-18
tags: ["Notes"]
draft: false
---
```

The rest of the file could be written in ordinary Markdown.

## Generating pages

At build time, Astro read all published notes and generated a page for each one. It also updated the homepage, the post list, the RSS feed, and the sitemap.

## Publishing automatically

After a push to GitHub, GitHub Actions built the site and published the output to GitHub Pages. Publishing a new note took three steps:

1. Create a Markdown file.
2. Write the note.
3. Commit and push to GitHub.

The setup was simple, with room to add categories, comments, search, and a custom domain later.

The site's implementation has changed since then. Writing in Markdown and using version control to revise the site remain part of my workflow.
