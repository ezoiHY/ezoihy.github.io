---
layout: project
title: Monocular RGB control of a robotic hand
description: Retargeting human hand motion from RGB images to an articulated robotic hand in simulation.
category: Vision & Control
year: "2026"
order: 2
permalink: /projects/monocular-hand-control/
featured: true
accent: peach
image: /assets/img/retarget.svg
image_alt: Conceptual mapping from human hand landmarks to robotic hand motion
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
