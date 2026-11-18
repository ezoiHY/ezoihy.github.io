---
layout: project
title: Voice-controlled quadruped with a local language model
description: Connecting natural-language instructions to locomotion and interaction on a Unitree Go1.
contribution: I deployed Qwen locally with Ollama and connected its outputs to the Go1 motion-control interface through an API.
related_projects: [/projects/monocular-hand-control/, /projects/robotic-fish/]
short_title: Voice-controlled Go1
design_choice: Ollama runs Qwen locally. An API passes the model output to the Go1 motion-control interface.
evidence: The hardware demonstration shows the Go1 walking toward the camera and rising onto its hind legs.
category: Embodied Intelligence
year: "2025"
sort_year: 2025
sort_priority: 10
permalink: /projects/language-quadruped/
featured: true
accent: blue
image: /assets/img/language-quadruped-poster.webp
cover: /assets/img/optimized/language-quadruped-cover-800.webp
cover_width: 800
cover_height: 451
image_alt: A Unitree Go1 approaching the camera and rising onto its hind legs during the project demonstration
image_width: 852
image_height: 480
image_caption: Real hardware demonstration, excerpted from the original project video.
video: /assets/video/language-quadruped-demo.mp4
video_source: https://www.bilibili.com/video/BV1bPKPzZEog/
tags: [Unitree Go1, Qwen, Ollama, Local LLM]
highlights:
  - value: Go1
    label: Quadruped platform
  - value: Qwen
    label: Local language model
---

## From language to robot actions

This engineering project uses a **Unitree Go1** quadruped to explore how natural-language instructions can be translated into locomotion and interaction.

I deployed Qwen models locally through **Ollama** and built an API pipeline connecting model outputs to the robot's motion-control interface.

## System workflow

1. Receive a natural-language instruction.
2. Process it with a locally deployed Qwen model.
3. Pass the model output through the API pipeline to the Go1 motion-control interface.

The video above shows the physical robot demonstration. The project explores the connection between language interpretation and motion execution.
