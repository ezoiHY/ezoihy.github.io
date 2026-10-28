---
layout: project
title: Hyadex
description: A self-hosted workspace for coordinating Claude Code and Codex through a native macOS app.
category: Software
year: "2026"
permalink: /projects/hyadex/
featured: true
sort_year: 2026
sort_priority: 30
wide_media: true
image: /assets/img/software/hyadex-discussion.png
image_alt: Hyadex macOS interface showing a sample discussion between a user, Claude Code, and Codex
image_width: 1600
image_height: 1000
image_caption: Hyadex group discussion interface, rendered by the app's snapshot mode using built-in sample data.
image_source: https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/images/group-discussion.png
tags: [AI Agents, SwiftUI, FastAPI]
---

[View the code and documentation on GitHub](https://github.com/ezoiHY/Hyadex).

## A native workspace for coding agents

Hyadex brings coding agents into a desktop workspace while keeping execution on a user-controlled Mac or Linux server. The macOS application connects over a local network or Tailscale, so agents work where the repositories and development tools already reside.

Claude Code runs through the Claude Agent SDK, and Codex through its app-server. Each retains its native conversation continuity, MCP servers, skills, project settings, and approval controls. The interface combines streaming replies and tool activity with file attachments, searchable conversations, persistent tmux terminals, and per-turn code diffs. Changed files remain available beside the conversation for inspection.

<figure class="project-screenshot">
  <a href="{{ '/assets/img/software/hyadex-changes.png' | relative_url }}"><img src="{{ '/assets/img/software/hyadex-changes.png' | relative_url }}" alt="Hyadex sample conversation with a changed-files list and an adjacent code-diff panel" width="1600" height="1000" loading="lazy"></a>
  <figcaption>Inspecting changed files alongside a conversation. Snapshot-mode render with built-in sample data. <a href="https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/images/chat-changes.png">Repository source</a>.</figcaption>
</figure>

## Collaboration with explicit control

[Group discussions](https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/GROUP_DISCUSSIONS.md) place the user and multiple agents in a shared timeline. Mentions, or a configured default responder, determine who runs. Each participant receives the messages it has not yet seen, together with updates to the shared brief. Sequential and parallel rounds support both collaborative implementation and independent review.

An agent's final reply includes a receipt of files changed during its turn. Mentions can hand work to another participant, subject to a configurable hand-off limit. Individual participants retain their own permissions, while native approval requests remain visible in their member chats. This keeps coordination and human decisions within the same workspace.

<figure class="project-screenshot">
  <a href="{{ '/assets/img/software/hyadex-approval.png' | relative_url }}"><img src="{{ '/assets/img/software/hyadex-approval.png' | relative_url }}" alt="Hyadex sample Codex conversation with an inline command approval request and allow or reject controls" width="1600" height="1000" loading="lazy"></a>
  <figcaption>A native Codex approval request presented in the conversation. Snapshot-mode render with built-in sample data. <a href="https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/images/chat-approval.png">Repository source</a>.</figcaption>
</figure>

## Autopilot from a goal to reviewed changes

[Autopilot](https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/AUTOPILOT.md) organizes a goal into a plan and a sequence of implementation tasks. By default, Claude Code plans and reviews while Codex implements. Users can approve the initial plan, require approval after each step, and choose an isolated Git worktree or work in place.

When a verification command is supplied, the server runs it before review; a failed check prevents approval. The reviewer can accept the work, request revisions, or ask for replanning. In worktree mode, an approved task becomes a commit containing the reviewed tree. Pause, feedback, and resume controls let the user intervene without discarding completed tasks.

<figure class="project-screenshot">
  <a href="{{ '/assets/img/software/hyadex-autopilot.png' | relative_url }}"><img src="{{ '/assets/img/software/hyadex-autopilot.png' | relative_url }}" alt="Hyadex sample Autopilot run showing a task plan, verification in progress, and review feedback" width="1600" height="1000" loading="lazy"></a>
  <figcaption>Autopilot displaying the plan, task progress, and verification stage. Snapshot-mode render with built-in sample data. <a href="https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/images/autopilot-running.png">Repository source</a>.</figcaption>
</figure>

## Scheduling and recovery

Scheduled work can target a chat or group using daily, weekly, interval, one-off, or cron schedules. Job records distinguish completed, failed, stopped, and running turns; group jobs also track dispatch to participants. Run history preserves outcomes and errors for later inspection.

Durable queues and append-only event logs support longer sessions. Clients reconnect from their last applied event sequence, and the server reconciles queued work and group dispatches after a restart. Interrupted Autopilot runs can move to a state requiring attention, from which the user can resume the relevant phase.

<figure class="project-screenshot">
  <a href="{{ '/assets/img/software/hyadex-scheduled-jobs.png' | relative_url }}"><img src="{{ '/assets/img/software/hyadex-scheduled-jobs.png' | relative_url }}" alt="Hyadex sample scheduled-jobs table showing destinations, schedules, next-run times, and previous outcomes" width="1600" height="1000" loading="lazy"></a>
  <figcaption>Scheduled jobs with their next run and previous outcome. Snapshot-mode render with built-in sample data. <a href="https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/images/scheduled-jobs.png">Repository source</a>.</figcaption>
</figure>

## Architecture and project status

The Python/FastAPI server separates API routes, collaboration features, provider runtimes, the turn engine, and persistent storage. REST endpoints handle requests while WebSockets stream conversation events. The SwiftUI client separates networking, application state, rich-text rendering, terminal emulation, and presentation into Swift Package Manager targets.

Hyadex remains in early development. It began from the [AgentsDock](https://github.com/ZhengyiLuo/AgentsDock) server and is developed independently under the Apache License 2.0. The repository's [architecture documentation](https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/ARCHITECTURE.md) and source code describe the implementation and its current boundaries.
