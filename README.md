# Harry Han

A personal academic website built with [al-folio](https://github.com/alshedivat/al-folio) v1 and Jekyll. It retains al-folio’s academic reading order, an approximately 930px text column, a right-hand portrait, and English content covering research, projects, publications, a CV, and personal writing.

The homepage has three independent glass panels: the profile, Selected projects, and Latest posts. Interior pages use one `document-panel`. Rows inside a panel do not create additional glass layers. The navigation stays in normal document flow and scrolls with the page, avoiding overlap with the content.

Website: [ezoihy.github.io](https://ezoihy.github.io). This redesign is developed on `codex/academic-homepage` for preview and review; pushing that branch does not deploy the public site.

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
```

Generated files are written to `_site/` and should not be committed. Gemfile and Gemfile.lock pin the dependencies; editing content does not require reinstalling them.

## Files to edit

| File or directory | Purpose |
| --- | --- |
| `_data/profile.yml` | Contact details, experience, research interests, and About content |
| `_pages/home.html` | Homepage biography and section structure |
| `_data/cv.yml` | Structured CV rendered by the al-folio CV plugin |
| `_projects/*.md` | Project pages, descriptions, tags, and ordering |
| `_posts/*.md` | Research notes, reading notes, and personal writing |
| `_bibliography/papers.bib` | Verified publication entries in BibTeX |
| `assets/img/` | Portrait, project source photographs, AI-assisted covers, screenshots, retained conceptual illustrations, and original Big Sur wallpaper frames |
| `assets/css/studio.css` | Layout, glass materials, and motion |
| `assets/js/studio.js` | Theme, background preference, search, and other controls |
| `assets/js/wallpaper.js` | Visitor-local clock schedule, wallpaper loading, and frame changes |
| `assets/js/liquid-glass.js` | Fixed-wallpaper lens integration and lifecycle |
| `assets/js/glass-wallpaper.js` | Rim-only WebGL adapter using the skill's shared optical map |
| `assets/js/glass-controls.js` | Compact navigation and input lenses, adapted from the liquid-glass-web skill |
| `assets/vendor/gentpan-liquidglass.js` | Unmodified, locally served SVG refraction engine |
| `assets/vendor/gentpan-liquidglass.LICENSE.txt` | MIT license for the refraction engine |
| `_pages/`, `_layouts/`, `_includes/` | Pages, layouts, and shared components |
| `_config.yml` | Site metadata, URLs, and plugin configuration |

See the [content guide](docs/CONTENT.md), [architecture notes](docs/AL-FOLIO-ARCHITECTURE.md), and [maintenance boundaries](docs/AL-FOLIO-BOUNDARIES.md).

## GitHub Pages deployment

1. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
2. Make changes on a development branch, build locally, and inspect the preview.
3. Review the PR and merge into `main`, or `master` if that is the repository’s production branch.
4. `.github/workflows/deploy.yml` builds and publishes the site. Check the deployment result in Actions.

Deployment is limited to `main` and `master`, including manually dispatched runs. `codex/academic-homepage` is a review branch.

The site keeps `https://ezoihy.github.io` with an empty `baseurl` and preserves the existing `/posts/*` URLs. Update `url`, `baseurl`, and relevant links if the domain or repository path changes.

## Wallpaper and glass

The wallpaper uses eight original photographic frames of Apple’s Big Sur coast, extracted from a locally installed HEIC. `assets/js/wallpaper.js` selects the photograph using the visitor’s local clock, from night through dawn, daylight, sunset, and dusk. This is a fixed browser-local schedule, not Apple’s solar-position algorithm, and it does not request geolocation. The schedule and provenance are documented in [UPSTREAM.md](UPSTREAM.md) and [the wallpaper asset notes](assets/img/WALLPAPER.md). Apple’s artwork is separate from the repository’s MIT-licensed code.

The toolbar’s wallpaper button opens the Big Sur settings panel. Use the time slider, enter a time, or choose Sunrise, Day, Sunset, or Night to preview a lighting state. Turn on **Follow local time** to return to the automatic schedule. **Show wallpaper** switches between the photographs and a solid color. Both preferences are saved in the browser. The theme button independently controls the interface’s light/dark mode; it does not select the wallpaper photograph.

The current frame loads first; automatic mode also preloads the next distinct frame. CSS handles a three-second scheduled crossfade, a shorter 0.8-second manual preview transition, without a per-frame JavaScript loop. The minute-boundary clock pauses during manual preview, while the page is hidden, or when solid mode is active. Automatic mode refreshes immediately on resume.

Outside WebKit, the glass uses the locally vendored [gentpan/liquidglass](https://github.com/gentpan/liquidglass) engine's rounded lens map. A WebGL adapter of the `liquid-glass-web` skill paints only the curved rims, with subtle RGB separation. One directional CSS highlight stays attached to each card; the canvas adds no separate specular light. Content panels use 28px maximum displacement across a 24px band; navigation/footer use 18px across 16px. Optical opacity follows the rounded outline and fades smoothly to zero through the inner 60% of that band, before the rim strips end. The frost setting is 10%, implemented as 2px native background blur on a 0–20px design scale. Panel corners remain 32px on desktop and 26px on mobile.

Text remains ordinary DOM above one uniform `rgb(8 15 24 / .10)` tint covering the entire card, with no inset tint or halo to outline a second inner surface. The owner requested a lighter mask; crisp text with a compact dark shadow supports readability above the lightly blurred wallpaper. Default contrast varies with the photograph. Reduced transparency or increased contrast restores an opaque surface with at least 4.5:1 for the wallpaper text tokens. Search and wallpaper settings use only 0.75px native blur.

The `liquid-glass-web` skill's overlay-copy pattern powers a spring-driven navigation indicator and refractive switch/slider thumbs. Real links and inputs remain accessible. Thumb lenses exist only during interaction; the small navigation lens bends label copies without copying the wallpaper. Both use the existing, unchanged local engine.

Safari/WebKit uses native CSS glass instead of scroll-sampled WebGL. Four narrow card-local clips reveal viewport-fixed photo layers with static 6px panel / 4px toolbar offsets and a smooth inward alpha fade. This is a gentle four-direction approximation, not the continuous optical lens map. The source stays viewport aligned while the card owns the rounded clip; no scroll listener, photo readback, canvas, or sampling frame runs for this path. The 2px frost, uniform 10% tint, single rim, and wallpaper crossfade remain shared.

Chromium and Firefox retain the full wallpaper lens path when WebGL is available. Each card contains an absolute transparent WebGL canvas beneath its frost and text; the card's own radius and `overflow:hidden` clip the optical outline. Visible cards draw four narrow rim strips directly into their own canvas. There is no intermediate WebGL-to-2D bitmap copy, and the fixed wallpaper contains no optical canvas. Scrolling updates photo sampling immediately in the passive scroll event, while the outline remains attached to its card.

Decoded photographs are shared and reduced once to a maximum of 1536px per side; each lazily created card context caches its own photo textures and optical map. Each direct drawing buffer is capped at two million pixels, 1.5 times CSS pixel density, and the GPU's size limits. Idle pages have no permanent rendering loop. Existing wallpaper crossfades drive temporary draws. With WebGL unavailable, CSS supplies the same 2px frost, tint, and attached highlight. Sources, limits, and licenses are recorded in [UPSTREAM.md](UPSTREAM.md).

Reduced motion disables transitions, so scheduled photographs switch instantly. Reduced transparency and increased contrast hide optical layers and restore opaque panels. Hidden pages and solid mode release GPU textures and maps; off-screen lenses are not drawn. `node scripts/check_glass.cjs` covers the integration lifecycle; the wallpaper check covers scheduling.

Photo sampling uses each card's position relative to the fixed wallpaper; optical silhouettes stay at local `(0, 0)` inside the card. A bounded 450ms alignment pulse follows native rubber-banding without hiding or switching the material. Native pull-to-refresh is retained. The skip link stays clipped until keyboard focus so it cannot appear from outside the viewport during a bounce.

## Content and upstream

The biography, four project histories, award summaries, portrait, and two posts come from the previous personal site. The old Astro article is marked as a historical implementation record. No publications, hobbies, enrollment dates, or other missing personal details were invented.

Homepage and project-grid thumbnails share a 16:9 frame and fit their media without cropping. The prosthetic hand and robotic fish thumbnails use AI-assisted wide covers derived from photographs supplied by the site owner on October 15, 2026. The edits were requested to expand the surrounding backgrounds; the unchanged source photographs remain on the project detail pages. The monocular hand screenshot and quadruped video use their authentic source media, fitted within the same frame without AI processing. The quadruped preview is a silent loop from the owner's real Bilibili demo, with a still frame as its fallback. The earlier hand and fish SVGs remain stored as conceptual illustrations and are no longer used for project previews. Media sources and cover preparation are recorded in `assets/img/PROJECT-MEDIA.md` and `assets/video/README.md`. When replacing media, update the alternative text and captions too.

The site uses `al_folio_core 1.0.15`, `al_folio_cv 1.0.2`, and `al_folio_upgrade 1.0.3`. BibTeX publications and the structured CV retain al-folio’s academic content model. Review the architecture notes and local overrides before upgrading the upstream runtime.
