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
| `research_interests` | Research interests, labels, descriptions, and optional verified project/demo links |
| `education`, `awards` | Education and awards on the About page |
| `research_experience` | Institutional research and internship appointments on the homepage and About page |
| `experiences` | Retained project summaries; institutional appointments belong in `research_experience` |
| `toolkit` | Retained verified background data; not displayed as a separate skills section |
| `email`, `github` | Contact details and links |

The homepage portrait, introduction, and SCUT and PAIRS Lab role links are defined in `_pages/home.html`. The right-hand portrait uses the image variants from `_data/profile.yml` and links to About. The About page renders the full `profile.bio`; both pages use `profile.research_experience`. Keep names, dates, and contributions aligned with the approved records. Affiliation logo sources are recorded in `assets/img/affiliations/README.md`.

The homepage has a compact sticky section navigator for Projects, Software, Experience, and Writing. Keep its targets aligned with the real section IDs. Main navigation is configured in `_data/navigation.yml`; Home points to `/` and About points to `/about/`. The brand also links home. Every interior page has a visible Home breadcrumb and a Back to home footer link. Project and post breadcrumbs link to their parent collection and restore the project filters or blog category that led to the detail page.

Use spaces, not tabs, for YAML indentation. Quote year-only values, for example `year: "2026"`. Leave unknown dates empty instead of guessing.

`personal.interests`, `personal.reading`, and `personal.gallery` are empty arrays reserved for verified details. They do not currently generate a reading list or gallery. Publish personal writing as posts using the instructions below.

Site titles, sharing descriptions, URLs, and the global email are configured in `_config.yml`. Restart Jekyll after editing that file.

## Search and sharing

Search indexes titles, descriptions, tags, categories, and body text from published projects/posts and pages with `searchable: true`. `_includes/search-data.liquid` removes template markup and adds the profile/CV data and attributed lab demonstrations for their relevant pages. Search ranks title matches above description, keyword, and body matches; terms can match across these fields. Keep technical terms in the actual project body or tags so searches such as `Qwen`, `HaMeR`, and `YOLOv8` continue to find the relevant work. Search opens with the main navigation links. The scope controls narrow results to projects, research, posts, or pages. Research topics, lab demonstrations, profile sections, the CV PDF, and project comparison have direct entries. Navigation aliases are configured in `_data/navigation.yml`. The index stays local and is built into the page; no search service receives queries.

Sharing metadata uses the page's source `image`, falling back to the profile portrait. Optional `social_image` and `social_image_alt` override that pair for a dedicated share asset. Use verified media and matching alternative text. `canonical_url` can point compatibility pages to their main page; `/papers/` uses `/publications/` while retaining a working fallback link without JavaScript.

## CV

The web CV at `/cv/` is rendered from `_data/cv.yml` by `al_folio_cv`. The approved PDF source is [`_cv/main.tex`](../_cv/main.tex), with compilation and provenance notes in [`_cv/README.md`](../_cv/README.md). Its compiled PDF is published at `/assets/pdf/yu-han-cv.pdf`. Keep the LaTeX source, `_data/cv.yml`, and `_data/profile.yml` aligned when changing affiliations, dates, experience, research interests, awards, or contact information. Compile and inspect the LaTeX CV before replacing the downloadable PDF; browser printing is a separate export of the web layout.

The explicit Email and GitHub links above the rendered CV come from `_data/profile.yml`; they preserve the GitHub entry that the current plugin does not render from `social_networks`.

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
sort_year: 2024
sort_priority: 10
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

When copying an entry, change its title, path, sort fields, image, and body. Do not retain results or metrics belonging to another project.

- `sort_year` is the documented project year (the start year for a range). Projects sorts by descending year. On the homepage, Selected projects presents Robotics first and Research software second (`category: Software`), with descending year within each group. `sort_priority` breaks ties within a year, also descending; it is an editorial display priority and must not imply an unverified month or day.
- `featured: true` includes an entry in the homepage's static project list. All six current projects are visible without waiting for a carousel or running JavaScript. On desktop, the lead robotics project spans the column. The supporting hardware and software studies use image grids that adapt to smaller screens. The project groups follow the introduction, before research and industry experience. An existing `video` also enables an explicit Play preview control on the homepage.
- `code_url` is an optional verified public repository URL. It provides a code link in the homepage, collection, research examples, and near the detail title; `video_source` provides a full-demo link. Omit either when no public source is available.
- `category` supplies the technical label. `Software` projects belong to the Software filter; other current projects belong to Robotics. Keep category names consistent and revisit this mapping if a different broad area is introduced.
- `image` and its dimensions, alternative text, and caption describe the source image on the project detail page. Optional `cover`, `cover_width`, and `cover_height` select a separate thumbnail image for the homepage and project grid.
- The homepage Quick look dialog presents the source image, caption, and `contribution` (or `description`). It follows the same project order as the homepage.
- `contribution`, `design_choice`, and `evidence` provide the three engineering notes in each case study. `highlights` pairs each measured value with its label. `short_title` identifies the project in the comparison table. Keep these fields traceable to the project body or its sources.
- `related_projects` lists verified local project permalinks in reading order. A pair of projects with comparison data also receives a direct comparison link.
- `permalink` defines a stable URL. Preserve it after publication to avoid breaking shared links.

Write Markdown after the second `---`. Describe the question, your contributions, actual results, and any public code or videos. Omit a code link when no public repository exists.

The Projects collection provides All / Robotics / Software filters, keyword search using the same local index as global search, a visible result count, and Cards / List views. The URL carries `area=robotics|software`, optional `q` (up to 200 characters), and optional `view=list`. Filtering and keyword search combine; Clear filters keeps the chosen layout. Project detail and continuation links carry these parameters so All projects returns to the selected collection. The expandable comparison uses the `compare` query parameter for two project slugs in column order. Its link can be copied and reopened. Without JavaScript the full collection and the comparison notes remain readable.

`project-viewer.js` enhances only non-video detail hero links and `.project-screenshot > a` image links. Use links to the actual original asset, not an optimized thumbnail. The native dialog retains captions and source links, supports previous/next images, arrow keys, Escape, Fit/Actual size, and Open original. Videos keep their existing player. Without JavaScript the image links work normally. Descriptions with at least three `h2` elements with IDs receive an On this page outline; use ordinary Markdown headings. The detail footer provides the collection return link, Email, and links to the projects chosen in `related_projects`.

The prosthetic hand and robotic fish detail pages show the owner-supplied source photographs: the hand gripping a bottle and the fish in a water tank, provided as attachments on October 15, 2026. Those photographs were converted to WebP without cropping or retouching and remain as each project's `image`. Separate AI-assisted covers, `underactuated-hand-cover.webp` and `robotic-fish-cover.webp`, are used for thumbnails. The built-in image generator was asked to expand the surrounding backgrounds for a wider composition. The source photographs remain available on the detail pages. Prompt summaries and source records are in [`assets/img/PROJECT-MEDIA.md`](../assets/img/PROJECT-MEDIA.md), with the exact prompts in [`project-cover-prompts.md`](../assets/img/project-cover-prompts.md).

All homepage and project-grid thumbnail frames, including video previews, use 16:9 with `object-fit: contain`. The generated covers are 1672 × 941 and fit within that frame. The monocular hand screenshot and quadruped footage remain authentic source media and fit without cropping or AI processing. Detail figures retain their source image proportions. The legacy `image_preserve_ratio` flag no longer controls thumbnails. The earlier `hand.svg` and `fish.svg` remain stored as conceptual illustrations and are no longer used for project previews.

When replacing media, update `image`, `image_alt`, and the English `image_caption`, or the separate `cover` fields when only the thumbnail changes, and review the shared notice at the bottom of `_pages/projects.html`. Use WebP, SVG, or compressed JPEG files stored in `assets/img/`. Set image and cover dimensions to the actual asset dimensions; the shared thumbnail frame supplies the display ratio. For screenshots, set `image_source` to the original source and record provenance in `assets/img/PROJECT-MEDIA.md`. Record owner-supplied photographs there with their provision date; do not infer a capture date, camera, or test result from a photograph. Record AI-assisted derivatives separately from unchanged sources, including the tool, prompt, output dimensions, and intended edit. For an animated preview, add a local H.264 MP4 path in `video`, keep a real poster in `image`, and link the full recording with `video_source`. The project grid and detail page share `_includes/project-media.liquid`; `project-media.js` starts the muted preview only after an explicit Play action and pauses when hidden or out of view. It never autoplays on page load. The video source and excerpt times belong in `assets/video/README.md`. For software screenshot galleries, set `wide_media: true` to use the full document width for the hero, and use `<figure class="project-screenshot">` blocks for additional images. Include dimensions, lazy loading, descriptive alt text, a full-size image link, and an English caption with repository provenance. Preserve any demonstration-data notice. Body images can be inserted with:

```md
![Describe what the photograph actually shows](/assets/img/your-project-photo.webp)
```

## Research page and lab demonstrations

`_pages/publications.html` retains `/publications/` and the `/papers/` compatibility link. It leads with two personal project examples (monocular hand control and the quadruped), using two large media columns on desktop and one on mobile. The five verified interests from `_data/profile.yml` appear as a research map, with every description visible. A separate PAIRS Lab demonstration section and the BibTeX publication list follow. The screenshot and hardware-video labels distinguish the evidence types. `assets/css/research.css` and `assets/js/research-map.js` are loaded only on this page. Preserve `#research-projects`, `#research-interests`, `#lab-demos`, and `#publications`. An empty bibliography stays empty; lab demonstrations are not added as personal publications.

`_includes/research-map.liquid` places the five interests around a Robotics hub on desktop and along a vertical branch on mobile. Hover or keyboard focus highlights a connection; activating a title selects that branch, activating it again clears selection, and the Robotics button resets the map. Descriptions and primary resource links are always visible. Selecting a topic expands its optional `context` and `context_link`. Each selection has a shareable `#interest-…` fragment and responds to browser Back and Forward. SVG connections are decorative, adapt to the actual node dimensions, and do not replace the headings or text. Without JavaScript, the blocks and links stay readable while the optional selection buttons remain disabled. Printed output uses simple blocks without the hub or connecting lines.

Each interest may have `links` with a `title` and local `url`. Only associate work supported by its existing description. The current force-aware robot learning interest intentionally has no project link: mechanical force distribution alone does not establish force-aware learning. Lab links retain PAIRS Lab attribution and target the demo article IDs (`#wrist-sensing`, `#block-stacking`) so the video appears at the destination.

The two lab demonstrations are configured in `_data/lab_demos.yml`: wrist-worn muscle-activity sensing and sequential block stacking. Their descriptions, posters, video URLs, ongoing-prototype status, and source anchors were checked against [PAIRS Lab Research](https://pairslab.github.io/research/) on November 16, 2026. The videos and posters remain hosted by PAIRS Lab; no media was copied into this repository. This is a lab-level showcase, not a claim of personal authorship or a verified publication.

On November 16, 2026, the owner explicitly requested automatic looping for these two lab demonstrations. This replaces the previous explicit-play-only rule for the lab section. Personal project previews, including the quadruped on the homepage, still require an explicit Play preview action.

`_includes/lab-demo.liquid` provides muted, looping videos with `preload="none"`, an accessible title and description, and an always-visible source link. With JavaScript, `project-media.js` replaces native video controls with the same persistent bottom-right Play/Pause preview button used by personal project videos. Keyboard focus stays on that button during playback. A lab video starts only when at least 10% of it is visible and the page is visible, deferring video requests until then. Both lab demos may play at the same time. They pause offscreen or when the page is hidden and can resume when visible again; an explicit visitor pause persists until the visitor starts playback manually.

Reduced motion disables automatic playback. Enabling it during a visit stops automatic loops; disabling it allows automatic playback again for videos the visitor has not explicitly paused. Explicit manual playback remains available with reduced motion enabled. If the browser blocks autoplay, the poster and Play preview button provide a manual fallback. A failed media request reveals a source fallback message and Retry preview. Without JavaScript, the native lab controls remain available for manual playback.

Personal previews and lab demos expose a Cancel loading button while a play request is pending. Requests that remain pending for 20 seconds show an English error and a retry action. Lab errors retain the external source link. Cancelling a lab load preserves the visitor's pause intent across scrolling and preference changes; only an explicit play action resumes it.

When adding a demonstration, verify its exact source, status, media URLs, and personal contribution before choosing the section. Keep group work in the attributed lab area unless the owner supplies a specific contribution. Do not infer participation from lab membership. Check external URLs when updating the data because source-hosted assets can move. The original media rights remain with their creators and are separate from this site's code license.

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

Use categories such as `Research`, `Build Log`, `Reading`, `Life`, and `Essays`. The blog generates filters from actual post categories, and posts can appear under multiple categories. Tags provide additional topics. The archive shares its selected category through `?category=`. Following a filtered post preserves its category in the article’s return links. Articles with at least two level-two headings have a section outline, collapsed by default on small screens.

Drafts can stay in `_posts/` with `published: false`. Future-dated posts are excluded from normal builds. The site timezone is `Asia/Shanghai`.

The migrated posts retain `/posts/hello-world/` and `/posts/how-this-blog-works/`. “Why I started this blog” introduces the intended writing topics without implying a completed collection of research notes. “How this blog worked” documents the original Astro implementation and is marked as a historical record, not the current maintenance procedure. Both retain their original dates.

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

The site retains the four robotics project histories, two posts, and verified background facts from the original site. Hyadex and PaperNAS were added from the owner-supplied public repositories on October 28, 2026; their project pages link to those repositories and their image provenance is recorded in `assets/img/PROJECT-MEDIA.md`. The homepage introduction and About biography were edited for clarity during the November 2026 site review, preserving the existing biographical and project facts. Personal information follows the approved `_cv/main.tex`, including education in 2023–2027 (expected), three research and industry appointments, five research interests, and the updated awards. See `_cv/README.md` for owner-provided updates and award wording. Preserve verified legacy facts in the source data and add further dates or claims only when supported.

Preview the affected pages and check titles, dates, images, links, and mobile layout, then run:

```bash
bundle exec jekyll build
python3 scripts/check_site.py
node scripts/check_wallpaper.cjs
node scripts/check_glass.cjs
node scripts/check_project_carousel.cjs
bundle exec al-folio upgrade overrides audit
```

Commit the update to a review branch after validation. Deployment instructions are in the root `README.md`.

## Appearance and media

Keep the 930px document reading area, system fonts, ordinary headings, and native links and inputs. The landscape wallpaper remains the default, with solid mode available in settings. The wallpaper uses responsive WebP derivatives of the original Big Sur scenes, with the visitor's saved local-time or manual selection. `assets/js/wallpaper.js` loads only the selected image; `studio.js` owns settings, theme, menu, search, and filters.

The ambient pan, coastal light, and homepage reflection are defined in `assets/css/portfolio.css`. The wallpaper settings store the visitor’s animation preference in `harry-wallpaper-motion`. Background tabs pause these animations. Reduced motion, reduced transparency, increased contrast, forced colors, and solid backgrounds use still scenery.

Reading panels use near-opaque theme surfaces over photography. Only the header/footer have a CSS backdrop blur. Do not reconnect the historical WebGL, fixed-photo copies, or optical control modules without measuring browser scrolling and transfer cost. Their source and licenses remain retained; [UPSTREAM.md](../UPSTREAM.md) marks their documentation as historical.

Use responsive portrait sources and thumbnail derivatives instead of shipping the full source to small previews. Original project images and provenance remain intact. `scripts/optimize_media.py` generates resized WebP copies with Pillow as an optional authoring dependency, not a Jekyll build dependency. Update dimensions with the actual output sizes. No generated derivative changes a project's evidence or image captions.

After appearance changes, check desktop/mobile, both themes, wallpaper and solid modes, search, menu, filters, keyboard navigation, reduced motion, print, and no-JavaScript rendering. Run the build, `python3 scripts/check_site.py`, and `node scripts/check_wallpaper.cjs`. See [the audit](SITE-AUDIT-2026-11-04.md) for the current measurement method and remaining content work.
