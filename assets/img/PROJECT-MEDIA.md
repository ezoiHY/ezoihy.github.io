# Project media sources

## Hyadex

- Website asset: `software/hyadex-discussion.png` (1600 × 1000).
- Source: [`docs/images/group-discussion.png`](https://github.com/ezoiHY/Hyadex/blob/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6/docs/images/group-discussion.png), retrieved on October 28, 2026.
- The project's README identifies this as an app snapshot-mode render using built-in sample data. It is not a recorded conversation with real users.
- Preparation: copy the original PNG without cropping, retouching, or image generation. The shared thumbnail frame fits the complete image.

## PaperNAS

- Website asset: `software/papernas-library.jpg` (1265 × 712).
- Source: [`docs/images/library-light.jpg`](https://github.com/ezoiHY/PaperNAS/blob/main/docs/images/library-light.jpg), retrieved on October 28, 2026. Git blob SHA: `2b0ed0b68e144387b9234beb2d262bf8453e7fb3`.
- The repository's screenshot documentation identifies the library contents as synthetic demonstration papers, captured from the running application on October 26, 2026.
- Preparation: copy the original JPEG without cropping, retouching, or image generation. The shared thumbnail frame fits the complete image.

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


## Expanded software galleries

Added October 28, 2026. All files below were copied unchanged from the referenced repository revisions, with no cropping, retouching, or image generation. Inline figures link to the full-size local asset and the original repository file.

### Hyadex gallery

Source revision: `77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6` in [ezoiHY/Hyadex](https://github.com/ezoiHY/Hyadex/tree/77dcecbc8f02ac9f0acc6eae4b9ae78beb32eec6). Each image is a 1600 × 1000 app snapshot-mode render with built-in sample data, as documented by the repository README.

| Local asset in `software/` | Repository file |
| --- | --- |
| `hyadex-changes.png` | `docs/images/chat-changes.png` |
| `hyadex-approval.png` | `docs/images/chat-approval.png` |
| `hyadex-autopilot.png` | `docs/images/autopilot-running.png` |
| `hyadex-scheduled-jobs.png` | `docs/images/scheduled-jobs.png` |

### PaperNAS gallery

Source revision: `0958db1e7e6764f38b7f6e91ed0cadd99e51e602` in [ezoiHY/PaperNAS](https://github.com/ezoiHY/PaperNAS/tree/0958db1e7e6764f38b7f6e91ed0cadd99e51e602). The repository galleries document October 26, 2026 captures from the running applications using synthetic demonstration papers and research records. The native Mac image retains its original primarily Chinese interface labels; the surrounding website caption is English.

| Local asset in `software/` | Repository file | Dimensions | Git blob SHA |
| --- | --- | --- | --- |
| `papernas-pdf-reader.jpg` | `docs/images/pdf-reader.jpg` | 1265 × 712 | `7d039805b21c10a39dbc48614db375dbc34e685d` |
| `papernas-research-evidence.jpg` | `docs/images/research-evidence.jpg` | 1265 × 889 | `6e59f9c416c2dbc5307c2ea8aa8e93433d6f2910` |
| `papernas-research-plan.jpg` | `docs/images/research-plan.jpg` | 1265 × 889 | `f27c1820d78081993be8eee1bb43d87b79f7a837` |
| `papernas-macos-analysis.jpg` | `docs/images/macos-analysis.jpg` | 2720 × 1760 | `36b9f464488ae0f2cd11b8d379658fb591c6b672` |
