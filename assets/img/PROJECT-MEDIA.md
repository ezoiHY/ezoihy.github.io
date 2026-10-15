# Project media sources

## Underactuated prosthetic hand

- Website asset: `underactuated-hand-photo.webp` (1280 × 1280).
- Source: photograph provided by the site owner as an attachment on October 15, 2026.
- Original JPEG SHA-256: `0b6e8ec65a343a2c219a5452ec01cb1fe17c883e54d8d76358fdd049aa794fe3`.
- Content: the actual prosthetic hand gripping a bottle.
- Preparation: encode the complete photograph as WebP at quality 90, method 6, preserving its 1280 × 1280 dimensions. Normalize EXIF orientation and retain the ICC profile if present. No cropping, image generation, or retouching is used.

### Wide thumbnail cover

- Website asset: `underactuated-hand-cover.webp` (1672 × 941), fitted without cropping inside the shared 16:9 thumbnail frame.
- Source image: the owner-supplied hand photograph above. The unchanged `underactuated-hand-photo.webp` remains the project detail image.
- Tool: the built-in `image_gen` image generator, used on October 15, 2026.
- Prompt summary: extend the surrounding background into a wide composition, aiming to retain the complete hand and bottle. The generated cover is recorded separately from the retained source photograph.
- Exact prompt: [`project-cover-prompts.md`](project-cover-prompts.md).

## Robotic fish

- Website asset: `robotic-fish-photo.webp` (1706 × 1279).
- Source: photograph provided by the site owner as an attachment on October 15, 2026.
- Original JPEG SHA-256: `d77fe291c30b1b5e11ebb76e1963fcc8d83abecbf567a25b55a6e17fa0c93c49`.
- Content: the actual robotic fish in a water tank.
- Preparation: encode the complete photograph as WebP at quality 90, method 6, preserving its 1706 × 1279 dimensions. Normalize EXIF orientation and retain the ICC profile if present. No cropping, image generation, or retouching is used.

### Wide thumbnail cover

- Website asset: `robotic-fish-cover.webp` (1672 × 941), fitted without cropping inside the shared 16:9 thumbnail frame.
- Source image: the owner-supplied fish photograph above. The unchanged `robotic-fish-photo.webp` remains the project detail image.
- Tool: the built-in `image_gen` image generator, used on October 15, 2026.
- Prompt summary: extend the surrounding water-tank background into a wide composition, aiming to retain the complete robotic fish. The generated cover is recorded separately from the retained source photograph.
- Exact prompt: [`project-cover-prompts.md`](project-cover-prompts.md).

## Monocular RGB hand control

- Website asset: `monocular-hand-demo.webp`.
- Source: [`ex1.png` in Harry's project repository](https://github.com/ezoiHY/Kinematic-Control-of-Robotic-Hands-Based-on-a-Monocular-RGB-Cammera/blob/fd9e5a9b38ce52343627b7523bdca6104cc4532e/ex1.png), supplied by the site owner on October 14, 2026.
- Source Git blob: `07529fabf8c0aa9464e9f99ad65b4f8cc98be8c1`.
- Content: the second-row left screenshot pair, showing a two-finger gesture, RGB hand landmarks, and the corresponding robotic hand in SAPIEN simulation. This is a captured software demonstration, not a hardware photograph.
- Preparation: crop the original 3898 × 4041 montage at x=0, y=796, width=1949, height=795; resize to 1200 × 489 and encode as WebP at quality 90. The two corresponding views stay together. No image generation, retouching, or synthesized motion is used.
- The full original montage remains available at the source link. Its rights remain with the original rights holders, separate from the repository's code license.

The quadruped video and poster sources are recorded in [`../video/README.md`](../video/README.md). The monocular screenshot and quadruped footage retain their source framing and fit inside the shared 16:9 thumbnail frame without cropping or AI processing. The earlier `hand.svg` and `fish.svg` remain stored as conceptual illustrations; hand and fish thumbnails use the AI-assisted covers above, while detail pages use the unchanged source photographs.
