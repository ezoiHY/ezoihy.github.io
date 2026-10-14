# Content maintenance guide

Personal information, projects, posts, and publications are stored as YAML, Markdown, and BibTeX. Routine content updates do not require changing layouts or effects.

Keep titles, body text, tags, captions, alternative text, and category names in English so pages, search, and RSS use the same language.

## Personal information

Edit `_data/profile.yml`:

| Field | Used for |
| --- | --- |
| `name`, `role` | Name and role on the About page |
| `avatar` | Portrait path, currently `/assets/img/portrait.webp` |
| `bio` | About-page paragraphs |
| `research_interests` | Research interests, labels, and descriptions on the publications page |
| `education`, `awards` | Education and awards on the About page |
| `experiences` | First three Recent work entries, in array order |
| `toolkit` | Technical tools |
| `email`, `github` | Contact details and links |

The homepage name, role lines, biography, and affiliations below the portrait are written directly in `_pages/home.html`. The portrait caption shows two monochrome emblems side by side with `SCUT` and `HKUST(GZ)` labels, followed by GitHub, email, and CV icons. Full university names are available through each link's accessible label and hover title, and remain visible in the biography and role lines. The email address and location are not shown as caption text. University links point to their official homepages. Logo sources and display treatment are recorded in `assets/img/affiliations/README.md`. GitHub and email destinations still come from `_data/profile.yml`; CV links to `/cv/`. These sections are not generated from `headline` or `intro`. Retained fields such as `name_en`, `role_en`, `affiliation`, `affiliation_en`, `location`, `location_en`, `headline`, `intro`, and `social` are not currently used directly by public templates.

Use spaces, not tabs, for YAML indentation. Quote year-only values, for example `year: "2026"`. Leave unknown dates empty instead of guessing.

`personal.interests`, `personal.reading`, and `personal.gallery` are empty arrays reserved for verified details. They do not currently generate a reading list or gallery. Publish personal writing as posts using the instructions below.

Site titles, sharing descriptions, URLs, and the global email are configured in `_config.yml`. Restart Jekyll after editing that file.

## CV

The CV is rendered from `_data/cv.yml` by `al_folio_cv`. This is separate from profile data; check both when changing affiliations, experience, or contact information.

Keep the outer `cv:` and `sections:` keys. Structured section names must match the plugin, including `Education`, `Projects`, `Awards`, `Skills`, and `Academic Interests`.

- Use `date: "2026"` for a single known year.
- Use `start_date: "2024"` and `end_date: "2025"` for a known range.
- Use `end_date: present` for confirmed ongoing work.
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
image: /assets/img/hand.svg
image_alt: Conceptual structure of a pulley-free tendon-driven prosthetic hand
tags: [Underactuated Mechanisms, Tendon Transmission, Adaptive Grasping]
---
```

When copying an entry, change its title, path, order, image, and body. Do not retain results or metrics belonging to another project.

- `order` controls ordering; lower numbers appear first.
- `featured: true` makes an entry eligible for Selected projects. The homepage displays the first two by `order`.
- `category` controls filtering. Use consistent category names.
- The current layouts do not render the legacy `accent`, `highlights`, or `image_label` fields. Put verified metrics in the body; unused fields can be removed.
- `permalink` defines a stable URL. Preserve it after publication to avoid breaking shared links.

Write Markdown after the second `---`. Describe the question, your contributions, actual results, and any public code or videos. Omit a code link when no public repository exists.

Current project images are conceptual illustrations. When replacing one with a real photograph, update `image`, `image_alt`, and the English `image_caption`, and review the shared illustration notice at the bottom of `_pages/projects.html`. Use WebP, SVG, or compressed JPEG files stored in `assets/img/`. Body images can be inserted with:

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

The migration retains the original biography, four project histories, award summaries, and two posts. No publications, hobbies, enrollment/graduation dates, competition dates, or project URLs were invented. Add missing details as verified information becomes available.

Preview the affected pages and check titles, dates, images, links, and mobile layout, then run:

```bash
bundle exec jekyll build
python3 scripts/check_site.py
node scripts/check_wallpaper.cjs
```

Commit the update to a review branch after validation. Deployment instructions are in the root `README.md`.

## Glass panels and wallpaper

The layout keeps al-folio’s reading order and approximately 930px text area. Glass styling does not change the content data sources.

The homepage has four separate `glass-panel` sections with `data-liquid-glass="panel"`: profile, Recent work, Selected projects, and Latest posts. Contact links belong at the end of Latest posts. Do not add nested glass markers to individual experience or project rows. Interior pages use one `document-panel`, and navigation remains in normal document flow rather than covering the content. Panel corners are 32px on desktop and 26px on mobile.

The wallpaper consists of eight original photographs from Apple’s Big Sur coastal HEIC, exported to `assets/img/big-sur/`. The wallpaper button opens settings for **Show wallpaper**, **Follow local time**, an editable time, a slider, and four scene presets. Choosing a time enables manual preview and saves `harry-wallpaper-time` as `HH:MM`; enabling Follow local time saves `auto`. Show wallpaper independently retains the solid-background choice. The theme button separately controls interface light/dark mode. The photographs remain Apple’s copyrighted artwork, separate from the repository’s MIT code. Provenance and export details are documented in `assets/img/WALLPAPER.md`.

`assets/js/wallpaper.js` selects images using the visitor’s local clock: night at 00:00, dawn at 05:00, sunrise at 06:00, morning at 07:30, day at 10:00, late afternoon at 16:30, sunset at 18:00, dusk at 19:00, and night again at 20:00. This fixed schedule does not use Apple’s solar-position metadata or geolocation. It follows the browser’s timezone, independently of the site’s `Asia/Shanghai` content timezone.

Automatic mode loads the current photograph and preloads the next distinct one; manual mode loads the chosen photograph only. A minute-boundary clock selects automatic changes; CSS performs a three-second scheduled crossfade, a 0.8-second manual preview transition. The clock pauses during manual preview, while hidden, or in solid mode, and updates immediately when automatic mode resumes. To change the schedule, edit `periods` in `assets/js/wallpaper.js`, preserve the original frame indices, and run `node scripts/check_wallpaper.cjs`. The complete mapping is in [UPSTREAM.md](../UPSTREAM.md).

The material uses `gentpan/liquidglass`, served locally without changes. It generates a rounded-rectangle displacement map from a curved optical profile (refractive index 1.5), bends RGB channels slightly differently, and lights the rim from its geometry. Content panels use 28px refraction, 1.5px blur, and a 28px curved edge band. Navigation/footer use 20px refraction, 0.75px blur, and an 18px band. Both use subtle chromatic separation (0.035). Foreground content is outside the filtered layer.

Safari/WebKit and iOS use native 3px backdrop blur, a light neutral tint, and directional inset edge highlights on the large panels. Full-panel SVG refraction caused severe scrolling lag in Safari, so this fallback skips panel wallpaper copies, generated maps, and panel observers. Keep that early exit: a smaller displacement map alone does not make full-panel filtering cheap. iOS additionally needs to avoid unreliable fixed-background alignment. Run `node scripts/check_glass.cjs` after changing panel renderer selection or lifecycle.

The `liquid-glass-web` skill supplies the separate compact-control approach in `glass-controls.js`: a spring-driven refractive navigation indicator and switch/slider thumbs that turn to glass during a press. Controls keep their original links, input IDs, labels, values, and keyboard behavior. Decorative label/track copies are `aria-hidden` and ignore pointer events. `studio.js` emits `wallpaper-controls-sync` after updating settings, so external changes (presets, clock, and automatic mode) also update the visual thumbs. These small controls use the shared engine in Safari as well; do not expand them into full-panel or full-page filters.

Other desktop engines retain lenses containing the same two wallpaper images as the page, with matching cover sizing, center positioning, and crossfade state. Only these copies use fixed background attachment; the real wallpaper already lives in a fixed container. Do not add transforms to either: geometry drift would break their CSS alignment. The local-time schedule and scene crossfades remain dynamic in both renderers. There are no scroll sampling listeners, periodic geometry reads, DOM screenshots, or continuous JavaScript rendering loops; arbitrary DOM content is never captured.

Maintenance locations:

- `assets/css/studio.css`: fixed image alignment, tint, native fallback, and CSS transitions.
- `assets/js/studio.js`: wallpaper/theme preferences, search, and controls.
- `assets/js/wallpaper.js`: local-clock schedule, current/next image loading, and lifecycle handling.
- `assets/js/liquid-glass.js`: lens options, resize/visibility handling, and accessibility fallbacks.
- `assets/js/glass-controls.js`: skill-based navigation and input optics, bounded springs, and decorative copies.
- `assets/vendor/gentpan-liquidglass.js`: unmodified upstream engine. Update intentionally with its license and provenance.
- `assets/vendor/gentpan-liquidglass.LICENSE.txt`: retained MIT copyright and license.
- `assets/img/big-sur/`: eight original Big Sur frames and export metadata.

Reduced motion replaces crossfades with instant frame changes. Reduced transparency disables lenses and uses opaque surfaces. Solid mode and hidden pages release SVG filters; the intersection observer suspends off-screen lenses. Maps are rebuilt for size changes, capped at 320,000 pixels per surface, and cached by the upstream engine.

Keep copyright and license notices when modifying or distributing the engine. See [UPSTREAM.md](../UPSTREAM.md) for the source revision, checksum, and comparison with other implementations. After material changes, check both themes, wallpaper and solid modes, desktop Safari, desktop Chromium, mobile layout, menu/search/filtering, print, and reduced-motion/transparency styles. Routine content edits do not require changing the effects.
