# Yu Han (Harry)

A personal academic website built with [al-folio](https://github.com/alshedivat/al-folio) v1 and Jekyll. It retains al-folio’s academic reading order, an approximately 930px text column, a right-hand portrait, and English content covering research, projects, publications, a CV, and personal writing.

Selected projects presents all featured entries, with robotics rows followed by two compact software entries side by side on desktop. Each group uses descending `sort_year`, then descending `sort_priority` within a year; priority is an editorial tie-break, not an inferred date. The existing quadruped demo is playable directly from the homepage. Personal project videos load only after an explicit play action.

The homepage has four independent glass panels: the concise profile, Selected projects, Research & industry experience, and Latest posts. Interior pages use one `document-panel`. Rows inside a panel do not create additional glass layers. Main navigation stays in normal document flow; a compact homepage section navigator remains available while scrolling. Home is explicit in desktop and mobile navigation. Interior pages provide a Home breadcrumb and a footer return link; About links to `/about/`. Project breadcrumbs retain the collection's filter context.

Projects supports All / Robotics / Software, local keyword filtering, and Cards / List layouts. `area`, `q`, and `view` URL parameters make the selection shareable and preserve it through project details, continuation links, and return navigation. Project pages offer an image viewer with keyboard navigation, captions, original-size inspection, and ordinary original-image links without JavaScript. Longer descriptions receive a section outline.

The Research page leads with two large personal project demonstrations, followed by a research-interest map, separately attributed PAIRS Lab demonstrations, and the publication list. The five map nodes keep their descriptions visible, highlight branches on selection, and link to relevant existing work. Lab demo metadata lives in `_data/lab_demos.yml`; its videos remain hosted by the lab, with the shared Play/Pause preview button and source links. Native video controls remain the no-JavaScript fallback.

On November 16, 2026, the owner requested muted automatic looping for these two lab demos, replacing their earlier explicit-play-only behavior. With JavaScript, each starts when at least 10% visible and the page is visible, and both may play together. They pause offscreen or when the page is hidden; a visitor's explicit pause persists until manual playback. Reduced motion disables automatic playback, and a Play demo button remains available if the browser blocks autoplay. See [content maintenance](docs/CONTENT.md#research-page-and-lab-demonstrations).

Website: [ezoihy.com](https://ezoihy.com), hosted on GitHub Pages. Development branches, including `codex/academic-homepage`, are for preview and review; pushing those branches does not deploy the public site.

## Local preview

On the current computer, a separate Ruby environment is already configured. Run `./scripts/preview.sh` to start the preview with file polling enabled.

For another machine, install Ruby 3.4 and Bundler. Confirm that `ruby --version` reports 3.4.x rather than the older Ruby bundled with macOS, then run:

```bash
gem install bundler
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Open [the local preview](http://127.0.0.1:4000). Stop the foreground server with `Ctrl+C`. To run it in the background, add `--detach` and record the PID printed by Jekyll so it can be stopped later.

Content edits trigger regeneration. Restart the server after changing `_config.yml` or Gemfile. Build the production site with:

```bash
JEKYLL_ENV=production bundle exec jekyll build
python3 scripts/check_site.py
node scripts/check_wallpaper.cjs
bundle exec al-folio upgrade overrides audit
```

Generated files are written to `_site/` and should not be committed. Gemfile and Gemfile.lock pin the dependencies; editing content does not require reinstalling them.

Optional browser regression checks require a locally installed Playwright package and browser. With the preview running, use `SITE_URL=http://127.0.0.1:4000 node scripts/check_browser.cjs`. `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` can select an existing installation; `AUDIT_OUTPUT` controls screenshots and reports (default `test-results/browser`). The script checks both themes, mobile layout, wallpaper settings, search, menu, filters, video, no-JavaScript navigation, and print/accessibility modes.

## Files to edit

| File or directory | Purpose |
| --- | --- |
| `_data/profile.yml` | About biography, shared research experience, contact details, education, awards, and research interests |
| `_pages/home.html` | Homepage introduction, presentation, affiliation links, and section structure |
| `_data/cv.yml` | Structured CV rendered by the al-folio CV plugin |
| `_cv/main.tex` | Approved editable LaTeX CV; see `_cv/README.md` for provenance and compilation |
| `assets/pdf/yu-han-cv.pdf` | Downloadable PDF compiled from the approved LaTeX CV |
| `_projects/*.md` | Project pages, descriptions, tags, and ordering |
| `_posts/*.md` | Research notes, reading notes, and personal writing |
| `_bibliography/papers.bib` | Verified publication entries in BibTeX |
| `assets/img/` | Portrait, project source photographs, AI-assisted covers, screenshots, retained conceptual illustrations, and original Big Sur wallpaper frames |
| `assets/css/studio.css` | Layout, glass materials, and motion |
| `assets/js/studio.js` | Theme, background preference, search, and other controls |
| `assets/js/project-viewer.js`, `assets/css/project-viewer.css` | Detail-page image viewing and long-description outlines |
| `assets/css/research.css` | Research-page demonstration and interests layout |
| `assets/js/research-map.js` | Research-map connections, focus and selection |
| `assets/js/wallpaper.js` | Visitor-local clock schedule, wallpaper loading, and frame changes |
| `assets/js/liquid-glass.js` | Historical lens implementation; not loaded by the site |
| `assets/js/glass-wallpaper.js` | Historical WebGL adapter; not loaded by the site |
| `assets/js/glass-controls.js` | Compact navigation and input lenses, adapted from the liquid-glass-web skill |
| `assets/vendor/gentpan-liquidglass.js` | Unmodified, locally served SVG refraction engine |
| `assets/vendor/gentpan-liquidglass.LICENSE.txt` | MIT license for the refraction engine |
| `_pages/`, `_layouts/`, `_includes/` | Pages, layouts, and shared components |
| `_config.yml` | Site metadata, URLs, and plugin configuration |

See the [content guide](docs/CONTENT.md), [architecture notes](docs/AL-FOLIO-ARCHITECTURE.md), and [maintenance boundaries](docs/AL-FOLIO-BOUNDARIES.md).

The homepage retains the owner-approved introduction in `_pages/home.html`; the About page renders its biography from `profile.bio`. Both pages render appointments from `profile.research_experience`. Keep these fields, the structured CV, and the approved LaTeX CV aligned when updating personal information. The web CV is available at `/cv/`; the downloadable version is served at `/assets/pdf/yu-han-cv.pdf`. The CV intentionally omits a separate skills section; verified legacy tool and project details remain in their source data.

## GitHub Pages deployment

1. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
2. Make changes on a development branch, build locally, and inspect the preview.
3. Review the PR and merge into `main`, or `master` if that is the repository’s production branch.
4. `.github/workflows/deploy.yml` builds and publishes the site. Check the deployment result in Actions.

Deployment is limited to `main` and `master`, including manually dispatched runs. `codex/academic-homepage` is a review branch.

The canonical URL is `https://ezoihy.com` with an empty `baseurl`. Existing paths, including `/posts/*`, `/projects/`, `/about/`, and `/papers/`, stay unchanged.

### Custom domain and DNS

In the repository's **Settings → Pages → Custom domain**, save `ezoihy.com` before directing DNS to GitHub Pages. This repository publishes through a custom GitHub Actions workflow, so a `CNAME` file is not required and does not configure the domain.

In GoDaddy, open **DNS → DNS Records** for `ezoihy.com` and configure:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `ezoihy.github.io` |

Replace any existing apex parking A records and any conflicting `www` record. Preserve unrelated records, including email MX and TXT records. Use the default TTL; GoDaddy nameservers can remain in place. After GitHub's DNS check passes and the certificate is available, enable **Enforce HTTPS** in Pages settings. GitHub Pages redirects `www.ezoihy.com` to the configured apex domain when both DNS records are correctly configured. DNS changes may take up to 24 hours to propagate.

For account-level ownership verification, use **GitHub Settings → Pages → Add a domain** and add the exact TXT record GitHub supplies. Keep that verification record after verification succeeds.

See GitHub's [custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) and [domain verification instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).

## Appearance and performance

New visitors see the original Big Sur landscape behind a light/dark document theme. The toolbar can switch to a solid background or preview a time of day; explicit saved preferences remain respected. Photography stays behind near-opaque reading surfaces, so the theme and text contrast remain consistent. Header and footer use a small CSS blur only in wallpaper mode. No optical engine, GPU canvas, scroll sampler, or duplicated wallpaper is loaded.

`assets/js/wallpaper.js` loads only the selected frame, using a 960px WebP on mobile or 1600px on desktop. It is deferred and requests decorative images at low priority. There is no next-scene prefetch. The minute timer pauses while hidden, in solid mode, or during a manual time selection. CSS owns the short crossfade; reduced motion disables it. Reduced transparency or increased contrast makes every reading surface opaque.

The original photographs and licenses remain documented in [the asset notes](assets/img/WALLPAPER.md). The earlier optical implementation is retained as historical source in `assets/js/liquid-glass.js`, `glass-wallpaper.js`, `glass-controls.js` and the vendored engine; it is not included by the layout. `scripts/check_glass.cjs` and the historical carousel checks exercise that retained code, not current rendering performance.

All selected projects are visible in a static list. Personal project videos start only after **Play preview**. The two PAIRS Lab demos use `preload="none"` and defer video requests until they become visible; their automatic loops respect page visibility and reduced motion. Responsive portrait images and smaller thumbnail derivatives preserve the source media; regenerate them with `scripts/optimize_media.py` using Pillow. See [the audit](docs/SITE-AUDIT-2026-11-04.md) for measured before/after results and remaining content work.

## Content and upstream

The four robotics project histories, portrait, two posts, and verified background facts come from the previous personal site. Hyadex and PaperNAS descriptions and interface images come from the public repositories supplied by the owner on October 28, 2026. The About biography, education dates, three research and industry appointments, five research interests, and awards are synchronized with the owner-approved LaTeX CV in `_cv/main.tex`. The CV's [source notes](_cv/README.md) record the owner's updates and award wording. The old Astro article is marked as a historical implementation record. No publications or personal details are added without a verified source.

Homepage and project-grid thumbnails share a 16:9 frame and fit their media without cropping. The prosthetic hand and robotic fish thumbnails use AI-assisted wide covers derived from photographs supplied by the site owner on October 15, 2026. The edits were requested to expand the surrounding backgrounds; the unchanged source photographs remain on the project detail pages. The monocular hand screenshot and quadruped video use their authentic source media, fitted within the same frame without AI processing. The quadruped preview is a silent loop from the owner's real Bilibili demo, with a still frame as its fallback. The earlier hand and fish SVGs remain stored as conceptual illustrations and are no longer used for project previews. Media sources and cover preparation are recorded in `assets/img/PROJECT-MEDIA.md` and `assets/video/README.md`. When replacing media, update the alternative text and captions too.

The site uses `al_folio_core 1.0.15`, `al_folio_cv 1.0.2`, and `al_folio_upgrade 1.0.3`. BibTeX publications and the structured CV retain al-folio’s academic content model. Review the architecture notes and local overrides before upgrading the upstream runtime.
