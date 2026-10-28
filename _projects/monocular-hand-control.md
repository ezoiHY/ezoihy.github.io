---
layout: project
title: Monocular RGB control of a robotic hand
description: Retargeting human hand motion from RGB images to an articulated robotic hand in simulation.
category: Vision & Control
year: "2026"
sort_year: 2026
sort_priority: 10
permalink: /projects/monocular-hand-control/
featured: true
accent: peach
image: /assets/img/monocular-hand-demo.webp
image_alt: A two-finger human hand gesture tracked with RGB landmarks beside the corresponding robotic hand pose in SAPIEN
image_width: 1200
image_height: 489
image_caption: Project demo screenshot showing RGB hand landmarks and the corresponding robotic hand pose in SAPIEN simulation.
image_source: https://github.com/ezoiHY/Kinematic-Control-of-Robotic-Hands-Based-on-a-Monocular-RGB-Cammera/blob/main/ex1.png
tags: [HaMeR, Hand Reconstruction, Inverse Kinematics, Motion Retargeting]
highlights:
  - value: RGB
    label: Monocular visual input
  - value: IK
    label: Optimization-based inverse kinematics
---

## Vision-based hand control

This open-source project combines HaMeR's three-dimensional hand reconstruction with optimization-based inverse kinematics to retarget human hand motion to an articulated robotic hand in simulation.

The system takes monocular RGB images as input, without data gloves or motion-capture equipment. It connects visual perception, three-dimensional hand representations, and robot control, extending my interest in low-cost dexterous manipulation.

## Pipeline

1. Reconstruct three-dimensional hand information from monocular RGB input.
2. Retarget motion using optimization-based inverse kinematics.
3. Use the retargeted motion to control an articulated robotic hand in simulation.

The project focuses on motion retargeting between human and robotic hands, examining how visual input can be converted into executable robot motion.

[View the code and demonstration on GitHub](https://github.com/ezoiHY/Kinematic-Control-of-Robotic-Hands-Based-on-a-Monocular-RGB-Cammera).
