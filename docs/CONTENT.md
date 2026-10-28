# Content maintenance guide

Personal information, projects, posts, and publications are stored as YAML, Markdown, and BibTeX. Routine content updates do not require changing layouts or effects.

Keep titles, body text, tags, captions, alternative text, and category names in English so pages, search, and RSS use the same language.

## Personal information

Edit `_data/profile.yml`:

| Field | Used for |
| --- | --- |
| `name`, `role` | Name and role on the About page |
| `avatar` | Portrait path, currently `/assets/img/portrait.webp` |
| `bio` | About-page paragraphs, rendered as Markdown |
| `research_interests` | Research interests, labels, and descriptions on the publications page |
| `education`, `awards` | Education and awards on the About page |
| `research_experience` | Institutional research and internship appointments on the homepage and About page |
| `experiences` | Retained project summaries; institutional appointments belong in `research_experience` |
| `toolkit` | Retained verified background data; not displayed as a separate skills section |
| `email`, `github` | Contact details and links |

The homepage presentation and affiliations below the portrait are defined in `_pages/home.html`. The homepage introduction and role lines retain the owner-approved wording directly in `_pages/home.html`. The About page renders `profile.bio`; both pages share `profile.research_experience`. Keep the homepage wording distinct unless the owner requests a rewrite. The portrait caption shows two monochrome emblems side by side with `SCUT` and `HKUST(GZ)` labels, followed by GitHub, email, and CV icons. Full university names are available through each link's accessible label and hover title, and remain visible in the biography and About-page experience entries. The email address and location are not shown as caption text. University links point to their official homepages. Logo sources and display treatment are recorded in `assets/img/affiliations/README.md`. GitHub and email destinations come from `_data/profile.yml`; CV links to `/cv/`. Neither biography is generated from the retained `headline` or `intro` fields.

Use spaces, not tabs, for YAML indentation. Quote year-only values, for example `year: "2026"`. Leave unknown dates empty instead of guessing.

`personal.interests`, `personal.reading`, and `personal.gallery` are empty arrays reserved for verified details. They do not currently generate a reading list or gallery. Publish personal writing as posts using the instructions below.

Site titles, sharing descriptions, URLs, and the global email are configured in `_config.yml`. Restart Jekyll after editing that file.

## CV

The web CV at `/cv/` is rendered from `_data/cv.yml` by `al_folio_cv`. The approved PDF source is [`_cv/main.tex`](../_cv/main.tex), with compilation and provenance notes in [`_cv/README.md`](../_cv/README.md). Its compiled PDF is published at `/assets/pdf/yu-han-cv.pdf`. Keep the LaTeX source, `_data/cv.yml`, and `_data/profile.yml` aligned when changing affiliations, dates, experience, research interests, awards, or contact information. Compile and inspect the LaTeX CV before replacing the downloadable PDF; browser printing is a separate export of the web layout.

Keep the outer `cv:` and `sections:` keys. The current supported sections are `Education`, `Academic Interests`, `Experience`, `Projects`, and `Awards`. Use the plugin's `Experience` key for research appointments; a custom `Research Experience` key uses a different generic renderer. No separate skills section is displayed. Retain verified legacy tool and project details in their source data rather than adding them to the concise CV.

- Use `date: "2026"` for a single known year.
- Use `start_date: "2024"` and `end_date: "2025"` for a known range.
- Use `end_date: present` for confirmed ongoing work.
- Use month-level dates for known internships, such as `start_date: "2026-07"`; include the months in the summary when the plugin's date badges show years only.
- Omit unknown date fields instead of estimating them.
- Do not add unverified language proficiency, positions, or references.

## Projects

Each project is a Markdown file in `_projects/`. The frontmatter between the initial `---` lines configures its summary and detail page. An existing project provides this example:

```yaml
---
layout: project
title: Pulley-free tendon-driven underactuated prosthetic hand
description: A lightweight, adaptive prosthetic hand using a single actuator and a compact tendon mechanism.
category: Mechanism Design
year: "2024–2025"
order: 1
permalink: /projects/underactuated-hand/
featured: true
image: /assets/img/underactuated-hand-photo.webp
image_alt: A white prosthetic hand prototype grasping a clear plastic bottle
image_caption: "Project hardware: the prosthetic hand grasping a plastic bottle."
image_width: 1280
image_height: 1280
cover: /assets/img/underactuated-hand-cover.webp
cover_width: 1672
cover_height: 941
tags: [Underactuated Mechanisms, Tendon Transmission, Adaptive Grasping]
---
```

When copying an entry, change its title, path, order, image, and body. Do not retain results or metrics belonging to another project.

- `order` controls ordering; lower numbers appear first.
- `featured: true` makes an entry eligible for Selected projects. The homepage displays the first two by `order`.
- `category` controls filtering. Use consistent category names.
- `image` and its dimensions, alternative text, and caption describe the source image on the project detail page. Optional `cover`, `cover_width`, and `cover_height` select a separate thumbnail image for the homepage and project grid.
- The current layouts do not render the legacy `accent`, `highlights`, or `image_label` fields. Put verified metrics in the body; unused fields can be removed.
- `permalink` defines a stable URL. Preserve it after publication to avoid breaking shared links.

Write Markdown after the second `---`. Describe the question, your contributions, actual results, and any public code or videos. Omit a code link when no public repository exists.

The prosthetic hand and robotic fish detail pages show the owner-supplied source photographs: the hand gripping a bottle and the fish in a water tank, provided as attachments on October 15, 2026. Those photographs were converted to WebP without cropping or retouching and remain as each project's `image`. Separate AI-assisted covers, `underactuated-hand-cover.webp` and `robotic-fish-cover.webp`, are used for thumbnails. The built-in image generator was asked to expand the surrounding backgrounds for a wider composition. The source photographs remain available on the detail pages. Prompt summaries and source records are in [`assets/img/PROJECT-MEDIA.md`](../assets/img/PROJECT-MEDIA.md), with the exact prompts in [`project-cover-prompts.md`](../assets/img/project-cover-prompts.md).

All homepage and project-grid thumbnail frames, including video previews, use 16:9 with `object-fit: contain`. The generated covers are 1672 × 941 and fit within that frame. The monocular hand screenshot and quadruped footage remain authentic source media and fit without cropping or AI processing. Detail figures retain their source image proportions. The legacy `image_preserve_ratio` flag no longer controls thumbnails. The earlier `hand.svg` and `fish.svg` remain stored as conceptual illustrations and are no longer used for project previews.

When replacing media, update `image`, `image_alt`, and the English `image_caption`, or the separate `cover` fields when only the thumbnail changes, and review the shared notice at the bottom of `_pages/projects.html`. Use WebP, SVG, or compressed JPEG files stored in `assets/img/`. Set image and cover dimensions to the actual asset dimensions; the shared thumbnail frame supplies the display ratio. For screenshots, set `image_source` to the original source and record provenance in `assets/img/PROJECT-MEDIA.md`. Record owner-supplied photographs there with their provision date; do not infer a capture date, camera, or test result from a photograph. Record AI-assisted derivatives separately from unchanged sources, including the tool, prompt, output dimensions, and intended edit. For an animated preview, add a local H.264 MP4 path in `video`, keep a real poster in `image`, and link the full recording with `video_source`. The project grid and detail page share `_includes/project-media.liquid`; `project-media.js` manages muted looping, pause/play, visibility, and reduced motion. The video source and excerpt times belong in `assets/video/README.md`. Body images can be inserted with:

```md
![Describe what the photograph actually shows](/assets/img/your-project-photo.webp)
```

## Research notes, reading, and personal writing

Create a file named `YYYY-MM-DD-slug.md` in `_posts/`, for example `2026-10-13-reading-note.md`:

```yaml
---
layout: post
title: Replace with the title of your post
description: A one-sentence summary of the post.
date: 2026-10-13
categories: [Reading]
tags: [Book Notes]
permalink: /posts/reading-note/
published: false
---
```

Write the body after the second `---`. To publish, remove `published: false` or change it to `published: true`.

Use categories such as `Research`, `Build Log`, `Reading`, `Life`, and `Essays`. The blog generates filters from actual post categories, and posts can appear under multiple categories. Tags provide additional topics.

Drafts can stay in `_posts/` with `published: false`. Future-dated posts are excluded from normal builds. The site timezone is `Asia/Shanghai`.

The migrated posts retain `/posts/hello-world/` and `/posts/how-this-blog-works/`. “How this blog worked” documents the original Astro implementation and is marked as a historical record, not the current maintenance procedure.

## Publications

Add verified BibTeX records to `_bibliography/papers.bib`; Jekyll Scholar generates the publication list. No public publications have been entered yet, so the file remains empty.

**The following illustrates syntax only. It is not a real publication and has not been added to the bibliography. Replace it with verified bibliographic information before using it.**

```bibtex
@article{example_only_not_a_real_publication,
  title   = {Example title — replace with a verified publication},
  author  = {Example, Author},
  journal = {Example journal},
  year    = {2026},
  abstract = {Replace with the real abstract.}
}
```

Conference papers normally use `@inproceedings` with `booktitle`; journal papers use `@article` with `journal`. Separate authors with `and`, and give each record a unique key.

Additional supported fields:

- `doi`: the DOI identifier, without the `https://doi.org/` prefix.
- `pdf`: an existing local file path such as `/assets/pdf/your-paper.pdf`.
- `code`: the real public repository for that publication.
- `abstract`: text displayed in an expandable abstract.

Keep reading notes and work in progress in posts or projects rather than presenting them as published papers.

## Content provenance and validation

The site retains the four robotics project histories, two posts, and verified background facts from the original site. Hyadex and PaperNAS were added from the owner-supplied public repositories on October 28, 2026; their project pages link to those repositories and their image provenance is recorded in `assets/img/PROJECT-MEDIA.md`. The homepage introduction retains its earlier owner-approved wording independently of the About biography. Personal information now follows the approved `_cv/main.tex`, including education in 2023–2027 (expected), three research and industry appointments, five research interests, and the updated awards. See `_cv/README.md` for owner-provided updates and award wording. Preserve verified legacy facts in the source data and add further dates or claims only when supported.

Preview the affected pages and check titles, dates, images, links, and mobile layout, then run:

```bash
bundle exec jekyll build
python3 scripts/check_site.py
node scripts/check_wallpaper.cjs
node scripts/check_glass.cjs
bundle exec al-folio upgrade overrides audit
```

Commit the update to a review branch after validation. Deployment instructions are in the root `README.md`.

## Glass panels and wallpaper

The layout keeps al-folio’s reading order and approximately 930px text area. Glass styling does not change the content data sources.

The homepage has four separate `glass-panel` sections with `data-liquid-glass="panel"`: profile, Research & industry experience, Selected projects, and Latest posts. Contact links belong at the end of Latest posts. Do not add nested glass markers to individual experience or project rows. Interior pages use one `document-panel`, and navigation remains in normal document flow rather than covering the content. Panel corners are 32px on desktop and 26px on mobile.

The wallpaper consists of eight original photographs from Apple’s Big Sur coastal HEIC, exported to `assets/img/big-sur/`. The wallpaper button opens settings for **Show wallpaper**, **Follow local time**, an editable time, a slider, and four scene presets. Choosing a time enables manual preview and saves `harry-wallpaper-time` as `HH:MM`; enabling Follow local time saves `auto`. Show wallpaper independently retains the solid-background choice. The theme button separately controls interface light/dark mode. The photographs remain Apple’s copyrighted artwork, separate from the repository’s MIT code. Provenance and export details are documented in `assets/img/WALLPAPER.md`.

`assets/js/wallpaper.js` selects images using the visitor’s local clock: night at 00:00, dawn at 05:00, sunrise at 06:00, morning at 07:30, day at 10:00, late afternoon at 16:30, sunset at 18:00, dusk at 19:00, and night again at 20:00. This fixed schedule does not use Apple’s solar-position metadata or geolocation. It follows the browser’s timezone, independently of the site’s `Asia/Shanghai` content timezone.

Automatic mode loads the current photograph and preloads the next distinct one; manual mode loads the chosen photograph only. A minute-boundary clock selects automatic changes; CSS performs a three-second scheduled crossfade, a 0.8-second manual preview transition. The clock pauses during manual preview, while hidden, or in solid mode, and updates immediately when automatic mode resumes. To change the schedule, edit `periods` in `assets/js/wallpaper.js`, preserve the original frame indices, and run `node scripts/check_wallpaper.cjs`. The complete mapping is in [UPSTREAM.md](../UPSTREAM.md).

Outside Safari/WebKit, the material uses `gentpan/liquidglass`, served locally without changes. `glass-wallpaper.js` adapts the skill's WebGL renderer and reuses its rounded-rectangle optical map (refractive index 1.5). Each host contains its own absolute transparent canvas, clipped by the same host radius and `overflow:hidden` as its frost, text, and highlight. Each visible card renders four rim strips directly into its own lazily created WebGL context: 28px displacement across 24px for content, 18px across 16px for bars, curvature 4, chroma 0.1, and specular 0. Optical opacity fades along the rounded silhouette through the inner 60% of the curved band, reaching zero before the rim strips end; the centre stays transparent. A separate CSS layer adds 2px native background blur, representing the requested 10% frost on a 0–20px design scale. Real text and videos remain outside the optical layer.

One uniform `rgb(8 15 24 / .10)` tint covers the full card under the content. Do not add an inset tint or halo: these create a second inner outline. The rim and centre share the same tint and 2px frost. The owner requested a 10% dark mask and 10% frost. Crisp text, a compact dark shadow, and dark hover fills support readability, while contrast in the transparent default depends on the photograph. Reduced transparency or increased contrast restores opaque `#202a35` with at least 4.5:1 for the wallpaper text tokens. Search and settings dialogs use 0.75px blur. With WebGL unavailable, the panel fallback uses the same 2px native blur, the same tint, and CSS highlights.

Do not restore the old full-panel SVG filters over fixed-background copies: these caused Safari scrolling lag. There must also be no optical canvas mounted on the fixed wallpaper; that independent outline visibly separated from scrolling cards. Keep card-owned direct WebGL canvases. Do not restore the shared scratch canvas and per-scroll WebGL-to-2D copies: that transfer path produced a visible following delay in Safari. Photographs are downsampled once to at most 1536px per side and shared as upload sources; GPU textures and maps are cached per card context. Normal scroll events submit sampling coordinates immediately, without another animation-frame queue. A card context is created lazily within an 80px viewport margin; already created off-screen contexts are retained for re-entry. Buffers are capped at two million pixels, 1.5 times CSS density, and GPU size limits; maps are capped at 320,000 pixels and texture size. Hidden/solid modes release GPU resources and shrink bitmaps; context loss falls back to CSS. Run `node scripts/check_glass.cjs` after changing this lifecycle.

Safari/WebKit uses a native CSS alternative after fast scrolling still outran the GPU photo sampler. Four narrow rounded/clipped edge bands reveal viewport-fixed A/B photograph layers with static offsets (panels: 6px in 12px bands; bars: 4px in 8px bands) and inward alpha fades. This approximates a subtle bend, without the continuous lens map or chromatic split. It uses no canvas, sampling-photo decode, scroll listener, or animation-frame sampling. Keep source ancestors free of transform/filter/containment; put the 2px backdrop frost in a separate later sibling. The sources share the wallpaper's image variables, cover alignment, and CSS crossfades. Static offsets stay enabled with reduced motion; solid mode and reduced transparency hide the whole decorative wrapper. Do not re-enable the Safari GPU sampler to strengthen the effect: it reintroduces the fast-scroll delay.

The `liquid-glass-web` skill supplies the separate compact-control approach in `glass-controls.js`: a spring-driven refractive navigation indicator and switch/slider thumbs that turn to glass during a press. Controls keep their original links, input IDs, labels, values, and keyboard behavior. Decorative label/track copies are `aria-hidden` and ignore pointer events. `studio.js` emits `wallpaper-controls-sync` after updating settings, so external changes (presets, clock, and automatic mode) also update the visual thumbs. These small controls use the shared engine in Safari as well; do not expand them into full-panel or full-page filters.

For the GPU path, source photographs are sampled at the fixed wallpaper container's cover size and centre position; there are no CSS fixed-background copies. The local-time schedule and scene crossfades remain dynamic. Scrolling updates only the small set of panel sampling coordinates, directly in the passive scroll event. Native Safari scrolling can still lead main-thread sampling; do not promise zero compositor latency. No DOM screenshot, geometry polling timer, or idle animation loop is used.

Background sampling uses the host bounding rectangle minus the fixed wallpaper rectangle. Lens geometry stays at the card's local `(0, 0)` and is clipped by its host; scrolling must never position a separate silhouette in window coordinates. Edge gestures extend a bounded 450ms sampling pulse without changing canvas visibility or material. Native scrolling and pull-to-refresh remain enabled. Keep `.skip-link` clipped until `:focus-visible`, rather than merely translating it above the viewport where a bounce can reveal it.

Maintenance locations:

- `assets/css/studio.css`: fixed image alignment, tint, native fallback, and CSS transitions.
- `assets/js/studio.js`: wallpaper/theme preferences, search, and controls.
- `assets/js/wallpaper.js`: local-clock schedule, current/next image loading, and lifecycle handling.
- `assets/js/liquid-glass.js`: lens options, resize/visibility handling, and accessibility fallbacks.
- `assets/js/glass-wallpaper.js`: the skill's WebGL approach adapted for known wallpaper, rim drawing, and cached resources.
- `assets/js/glass-controls.js`: skill-based navigation and input optics, bounded springs, and decorative copies.
- `assets/vendor/gentpan-liquidglass.js`: unmodified upstream engine. Update intentionally with its license and provenance.
- `assets/vendor/gentpan-liquidglass.LICENSE.txt`: retained MIT copyright and license.
- `assets/img/big-sur/`: eight original Big Sur frames and export metadata.

Reduced motion replaces crossfades with instant frame changes. Reduced transparency disables lenses and uses opaque surfaces. Solid mode and hidden pages release SVG filters; the intersection observer suspends off-screen lenses. Maps are rebuilt for size changes, capped at 320,000 pixels per surface, and cached by the upstream engine.

Keep copyright and license notices when modifying or distributing the engine. See [UPSTREAM.md](../UPSTREAM.md) for the source revision, checksum, and comparison with other implementations. After material changes, check both themes, wallpaper and solid modes, desktop Safari, desktop Chromium, mobile layout, menu/search/filtering, print, and reduced-motion/transparency styles. Routine content edits do not require changing the effects.
