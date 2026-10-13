# Content maintenance guide

Personal information, projects, posts, and publications are stored as YAML, Markdown, and BibTeX. Routine content updates do not require changing layouts or effects.

Keep titles, body text, tags, captions, alternative text, and category names in English so pages, search, and RSS use the same language.

## Personal information

Edit `_data/profile.yml`:

| Field | Used for |
| --- | --- |
| `name`, `role` | Name and role on the About page |
| `affiliation_en`, `location_en` | School and location below the homepage portrait |
| `avatar` | Portrait path, currently `/assets/img/portrait.webp` |
| `bio` | About-page paragraphs |
| `research_interests` | Research interests, labels, and descriptions on the publications page |
| `education`, `awards` | Education and awards on the About page |
| `experiences` | First three Recent work entries, in array order |
| `toolkit` | Technical tools |
| `email`, `github` | Contact details and links |

The homepage name, role line, and biography are written directly in `_pages/home.html`. They are not generated from `headline` or `intro`. Retained fields such as `name_en`, `role_en`, `affiliation`, `location`, `headline`, `intro`, and `social` are not currently used directly by public templates.

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

Automatic mode loads the current photograph and preloads the next distinct one; manual mode loads the chosen photograph only. A minute-boundary clock selects automatic changes; CSS performs a three-second scheduled crossfade, a 0.8-second manual preview transition, and the slow drift. The clock pauses during manual preview, while hidden, or in solid mode, and updates immediately when automatic mode resumes. To change the schedule, edit `periods` in `assets/js/wallpaper.js`, preserve the original frame indices, and run `node scripts/check_wallpaper.cjs`. The complete mapping is in [UPSTREAM.md](../UPSTREAM.md).

The material is a DOM port of `rdev/liquid-glass-react`, using its original displacement JPEG, RGB SVG filter, and 1.5px screen/overlay rims. Content panels use base displacement 100, blur 16px, and saturation 140%; navigation/footer toolbars use 64, 7.2px, and 130%. Wallpaper mode uses white text with a translucent contrast treatment.

Safari and Firefox use native backdrop blur without SVG refraction, matching the upstream limitation. The browser composites the real backdrop; the glass implementation has no wallpaper copies, scroll-sampling handlers, sampling timers, canvas-generated maps, or React dependency. The separate wallpaper-selection clock runs only at minute boundaries.

Maintenance locations:

- `assets/css/studio.css`: layout, native blur/saturation, rim styling, and CSS motion.
- `assets/js/studio.js`: wallpaper/theme preferences, search, and controls.
- `assets/js/wallpaper.js`: local-clock schedule, current/next image loading, and lifecycle handling.
- `assets/js/liquid-glass.js`: SVG filter setup, resize handling, and pointer-responsive rims.
- `assets/img/big-sur/`: eight original Big Sur frames and export metadata.
- `assets/vendor/liquid-glass-displacement.jpg`: unchanged upstream standard texture.
- `assets/vendor/liquid-glass-react.LICENSE.txt`: retained MIT copyright and license.

Reduced-motion preferences stop wallpaper drift and pointer-driven rim changes, and replace the three-second crossfade with an instant frame change. The local-clock schedule still determines the correct photograph. Background animation and the minute-boundary clock pause when the page is hidden or the wallpaper is disabled. Reduced-transparency preferences hide the optical layers and use opaque surfaces.

Keep the upstream copyright and license with the port and texture when modifying or distributing them. See [UPSTREAM.md](../UPSTREAM.md) for the source commit and texture checksum. After changing the material, check wallpaper/solid modes, light/dark themes, Safari and Firefox fallbacks, mobile layout, and reduced-motion/transparency preferences. Routine content edits do not require changing these effects.
