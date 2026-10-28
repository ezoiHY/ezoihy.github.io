---
layout: project
title: PaperNAS
description: A self-hosted research workspace connecting paper reading, source evidence, and research records across Mac and web clients.
category: Software
year: "2026"
sort_year: 2026
sort_priority: 20
permalink: /projects/papernas/
featured: true
wide_media: true
image: /assets/img/software/papernas-library.jpg
image_alt: PaperNAS browser library showing groups and synthetic demonstration papers
image_width: 1265
image_height: 712
image_caption: PaperNAS browser client with synthetic demonstration papers, captured from the running application.
image_source: https://github.com/ezoiHY/PaperNAS/blob/0958db1e7e6764f38b7f6e91ed0cadd99e51e602/docs/images/library-light.jpg
tags: [Research Tools, SwiftUI, FastAPI, PostgreSQL]
---

[Source code](https://github.com/ezoiHY/PaperNAS) · [Mac app tour](https://github.com/ezoiHY/PaperNAS/blob/main/docs/MACOS-GALLERY.md) · [Feature documentation](https://github.com/ezoiHY/PaperNAS/blob/main/docs/FEATURES.md)

PaperNAS brings paper reading and research records into one personal workspace. A native Mac application and a browser client connect to a library hosted on a NAS, home server, or local machine. The central idea is to keep the path from an original paper to an interpretation inspectable: documents, notes, evidence, and subsequent judgments remain connected.

## Library and import

The library accepts PDFs, paper URLs, DOIs, and arXiv identifiers. Bounded searches of arXiv and Crossref collect candidates into a separate queue, where the reader decides what to import. Groups, search, filters, and batch organization support a reading workflow without treating every discovered item as part of the permanent library.

Import and document processing run as durable server tasks. Their progress can be inspected, and operations can be paused, resumed, cancelled, or retried. Work can continue while the browser or Mac client is closed.

## Reading and source evidence

Readers can move between original PDF pages, extracted text, figures, notes, and saved analyses. Notes retain a document version and page. The Mac client supports PDF text selections and rectangular anchors; the browser uses explicit page and quotation fields. Figures retain their source page, and extraction regions can be corrected through the application.

<figure class="project-screenshot">
  <a href="{{ '/assets/img/software/papernas-pdf-reader.jpg' | relative_url }}"><img src="{{ '/assets/img/software/papernas-pdf-reader.jpg' | relative_url }}" alt="PaperNAS browser PDF reader displaying a synthetic demonstration paper with page and note controls" width="1265" height="712" loading="lazy"></a>
  <figcaption>The browser reader displays server-rendered PDF pages and keeps source text, figures, and notes nearby. <a href="https://github.com/ezoiHY/PaperNAS/blob/0958db1e7e6764f38b7f6e91ed0cadd99e51e602/docs/images/pdf-reader.jpg">Original screenshot</a>.</figcaption>
</figure>

Passages and figures can be saved as evidence for a research question. Each evidence record preserves its original source anchor, so a later reparse or figure correction does not silently replace the material behind an earlier observation.

<figure class="project-screenshot">
  <a href="{{ '/assets/img/software/papernas-research-evidence.jpg' | relative_url }}"><img src="{{ '/assets/img/software/papernas-research-evidence.jpg' | relative_url }}" alt="PaperNAS research question with saved demonstration quotations and links to their source pages" width="1265" height="889" loading="lazy"></a>
  <figcaption>A research question gathers linked papers and quotations with their source pages. <a href="https://github.com/ezoiHY/PaperNAS/blob/0958db1e7e6764f38b7f6e91ed0cadd99e51e602/docs/images/research-evidence.jpg">Original screenshot</a>.</figcaption>
</figure>

## Questions, judgments, and plans

The research workspace connects collected evidence to revisable judgments. Verification plans record a hypothesis, method, baseline, measures, success criteria, stopping conditions, and a budget. Results from work performed outside the application can then be recorded alongside snapshots of the reader's evolving understanding.

This makes the reasoning and its history available for later review. PaperNAS records plans and results; it does not execute experiments. Research records can be exported as Markdown or JSON, alongside exports of analyses, original PDFs, and figures.

<figure class="project-screenshot">
  <a href="{{ '/assets/img/software/papernas-research-plan.jpg' | relative_url }}"><img src="{{ '/assets/img/software/papernas-research-plan.jpg' | relative_url }}" alt="PaperNAS verification plan showing a demonstration hypothesis, method, and baseline" width="1265" height="889" loading="lazy"></a>
  <figcaption>A verification plan records how a judgment will be checked; the pictured plan is demonstration content. <a href="https://github.com/ezoiHY/PaperNAS/blob/0958db1e7e6764f38b7f6e91ed0cadd99e51e602/docs/images/research-plan.jpg">Original screenshot</a>.</figcaption>
</figure>

## Optional analysis

Reading, notes, and research records work without a model provider. When enabled, paper analysis and cross-paper comparison send bounded source excerpts to a configured OpenAI-compatible provider. The server retains responses and validates cited quotations against the supplied text before publishing an analysis.

These checks establish where a quotation came from; they do not establish scientific correctness or guarantee complete paper coverage. Source links let the reader return to the original passage and assess the interpretation directly.

<figure class="project-screenshot">
  <a href="{{ '/assets/img/software/papernas-macos-analysis.jpg' | relative_url }}"><img src="{{ '/assets/img/software/papernas-macos-analysis.jpg' | relative_url }}" alt="Native PaperNAS Mac analysis reader with chapter navigation and source citation buttons for a synthetic demonstration" width="2720" height="1760" loading="lazy"></a>
  <figcaption>The native Mac reader presents chapter navigation and source citations. Its original interface labels are primarily Chinese. <a href="https://github.com/ezoiHY/PaperNAS/blob/0958db1e7e6764f38b7f6e91ed0cadd99e51e602/docs/images/macos-analysis.jpg">Original screenshot</a>.</figcaption>
</figure>

## Native Mac and web clients

The Mac application uses SwiftUI and PDFKit, with local KaTeX rendering for mathematical text. The browser uses plain JavaScript modules and CSS, including responsive layouts and light and dark appearances. Both clients share a FastAPI backend: PostgreSQL stores library records, revisions, and the task queue, while content-addressed files retain documents and derived assets.

PaperNAS remains an early-release, single-user workspace shared across authorized devices. The current version does not implement semantic search, Zotero synchronization, or scanned-document OCR.

All screenshots show the running application on October 26, 2026, using synthetic demonstration papers and research records. They illustrate the interface and workflow, not published research or measured experimental results.
