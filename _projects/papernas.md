---
layout: project
title: PaperNAS
description: A self-hosted research workspace connecting paper reading, source evidence, and research records across Mac and web clients.
category: Software
year: "2026"
order: 6
permalink: /projects/papernas/
featured: false
image: /assets/img/software/papernas-library.jpg
image_alt: PaperNAS browser library showing groups and synthetic demonstration papers
image_width: 1265
image_height: 712
image_caption: PaperNAS browser client with synthetic demonstration papers, captured from the running application.
image_source: https://github.com/ezoiHY/PaperNAS/blob/main/docs/images/library-light.jpg
tags: [Research Tools, SwiftUI, FastAPI, PostgreSQL]
---

[View the code and documentation on GitHub](https://github.com/ezoiHY/PaperNAS).

## From papers to research records

PaperNAS connects a personal paper library with the questions that emerge from reading. Papers can be imported from PDFs, URLs, DOIs, and arXiv identifiers. Notes, quotations, and figures retain their source references, while research questions bring together evidence, judgments, verification plans, and recorded results.

## Native and web workflows

A SwiftUI Mac app and a browser client share the same self-hosted library. The Mac reader uses PDFKit for original documents and local KaTeX rendering for mathematical text. A FastAPI backend with PostgreSQL stores the library and research history. Background workers continue importing and processing documents after a client closes.

## Optional model assistance

Paper analysis and cross-paper comparison can use a configured OpenAI-compatible model provider. The server checks cited quotations against supplied source text before publishing an analysis, allowing readers to follow claims back to the original material.

PaperNAS is an early-release workspace designed for individual researchers.
