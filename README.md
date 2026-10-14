# Harry Han

A personal academic website built with [al-folio](https://github.com/alshedivat/al-folio) v1 and Jekyll. It retains al-folio’s academic reading order, an approximately 930px text column, a right-hand portrait, and English content covering research, projects, publications, a CV, and personal writing.

The homepage has four independent glass panels: the profile, Recent work, Selected projects, and Latest posts. Interior pages use one `document-panel`. Rows inside a panel do not create additional glass layers. The navigation stays in normal document flow and scrolls with the page, avoiding overlap with the content.

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
| `assets/img/` | Portrait, project illustrations, and original Big Sur wallpaper frames |
| `assets/css/studio.css` | Layout, glass materials, and motion |
| `assets/js/studio.js` | Theme, background preference, search, and other controls |
| `assets/js/wallpaper.js` | Visitor-local clock schedule, wallpaper loading, and frame changes |
| `assets/js/liquid-glass.js` | Fixed-wallpaper lens integration and lifecycle |
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

The glass uses the locally vendored [gentpan/liquidglass](https://github.com/gentpan/liquidglass) engine: a rounded lens displacement field, subtle RGB separation, and a geometry-based specular edge. Content panels use 28px maximum rim displacement and 1.5px frost; navigation/footer use 20px and 0.75px. Panel corners remain 32px on desktop and 26px on mobile. A light neutral tint and text shadow support white type while letting the wallpaper show through.

The `liquid-glass-web` skill's overlay-copy pattern powers a spring-driven navigation indicator and refractive switch/slider thumbs. Real links and inputs remain accessible. Thumb lenses exist only during interaction; the small navigation lens bends label copies without copying the wallpaper. Both use the existing, unchanged local engine.

Safari/WebKit and iOS keep native backdrop blur on large panels, with a light neutral tint and directional edge highlights. They create no panel wallpaper copies or large SVG lenses: these caused severe Safari scrolling lag. Other desktop engines retain wallpaper refraction through ordinary SVG `filter`. There is no scroll-coordinate sampling, DOM capture, React, or animation while controls are idle. Wallpaper scheduling and crossfades remain active. Search and wallpaper settings retain native blur. `node scripts/check_glass.cjs` covers the panel renderer selection and lifecycle; control interaction also needs manual review after future changes. Sources, limits, and licenses are recorded in [UPSTREAM.md](UPSTREAM.md).

Reduced motion disables transitions, so scheduled photographs switch instantly. Reduced transparency hides optical layers and restores opaque panels. Hidden pages and solid mode release lens filters; off-screen lenses are suspended. The existing Node check verifies wallpaper scheduling and lifecycle behavior.

## Content and upstream

The biography, four project histories, award summaries, portrait, and two posts come from the previous personal site. The old Astro article is marked as a historical implementation record. No publications, hobbies, enrollment dates, or other missing personal details were invented.

Project illustrations are conceptual, not photographs of the hardware. When replacing them with real photographs, update the alternative text and captions too.

The site uses `al_folio_core 1.0.15`, `al_folio_cv 1.0.2`, and `al_folio_upgrade 1.0.3`. BibTeX publications and the structured CV retain al-folio’s academic content model. Review the architecture notes and local overrides before upgrading the upstream runtime.
