---
layout: project
title: Hyadex
description: A self-hosted workspace for coordinating Claude Code and Codex through a native macOS app.
category: Software
year: "2026"
order: 5
permalink: /projects/hyadex/
featured: false
image: /assets/img/software/hyadex-discussion.png
image_alt: Hyadex macOS interface showing a sample discussion between a user, Claude Code, and Codex
image_width: 1600
image_height: 1000
image_caption: Hyadex group discussion interface, rendered by the app's snapshot mode using built-in sample data.
image_source: https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/images/group-discussion.png
tags: [AI Agents, SwiftUI, FastAPI]
---

[View the code and documentation on GitHub](https://github.com/ezoiHY/Hyadex).

## Coordinating coding agents

Hyadex connects a native macOS application to coding agents running on a user-controlled Mac or Linux server. It integrates Claude Code through the Claude Agent SDK and Codex through its app-server, retaining each provider's conversation history, tools, settings, and approval controls.

Group discussions bring people and agents into a shared conversation, with mentions determining which agent responds. Autopilot organizes work into planning, implementation, verification, and review, with configurable approval steps. Scheduled jobs, code diffs, file attachments, and persistent terminals support longer development tasks.

## System design

The server uses Python and FastAPI with REST and WebSocket interfaces. The macOS client is built with SwiftUI. Append-only JSONL event logs support conversation recovery and reconnection.

Hyadex began from the AgentsDock server and is developed independently under the Apache License 2.0. The repository documents its upstream origins and subsequent development.
