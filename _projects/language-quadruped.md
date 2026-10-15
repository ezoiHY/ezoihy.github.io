---
layout: project
title: Voice-controlled quadruped with a local language model
description: Connecting natural-language instructions to locomotion and interaction on a Unitree Go1.
category: Embodied Intelligence
year: "2025"
order: 4
permalink: /projects/language-quadruped/
featured: false
accent: blue
image: /assets/img/language-quadruped-poster.webp
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

## Implementation

- Deployed Qwen models locally.
- Connected natural-language instructions to robot actions.
- Built an API pipeline from model outputs to the motion-control interface.

This project is part of my exploration of language models in physical robot systems. It also prompted me to consider how perception, interaction, and motion execution work together within a single system.
