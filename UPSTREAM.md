# Upstream and local design

This is Harry Han’s personalized **al-folio v1** academic website, adapted from:

- [al-folio starter](https://github.com/alshedivat/al-folio)
- Source snapshot: `ba1c8104a2f39c76ebc2fa9da1b02c66b75ea855` (2026-10-13)
- Core runtime: `al_folio_core 1.0.15`
- Data-driven CV: `al_folio_cv 1.0.2`
- Version/override auditing: `al_folio_upgrade 1.0.3`
- Publications: Jekyll Scholar with al-folio’s BibTeX content model

The original MIT license is retained in `LICENSE`. Site-specific text and the supplied portrait remain the author’s content. Four SVG illustrations were created for this site and depict concepts, not physical project photographs.

## Intentional customization

`_layouts/default.liquid`, `post.liquid`, and `bib.liquid` replace matching core layouts. `project.liquid` is a site-specific layout. `_includes/icon.liquid`, `symbols.liquid`, and `project-card.liquid` are site-specific components. `assets/css/studio.css`, `assets/js/studio.js`, and `assets/js/liquid-glass.js` implement the custom visual and interaction layer. The CV continues to render through upstream `al_folio_cv_render`.

This follows al-folio’s support for local overrides in user sites. The upstream starter’s rule against local layouts does not apply here. `.al-folio-overrides.yml` tracks acknowledged overrides; audit it after upgrades. Unused demo integrations and sample publications are not published. The optional `al_icons` integration is omitted because the site uses accessible inline SVG symbols instead of a third-party icon font.

## Migration and document structure

The prior Astro site is preserved in Git history (`origin/main` before migration). Biography, portrait, four project histories, and two posts were carried over. Existing post URLs are unchanged; `/papers/` directs to `/publications/`. GitHub Pages remains `https://ezoihy.github.io`, with `baseurl` empty.

The layout retains al-folio’s academic reading order: a right-hand portrait, continuous biography, dated entries, and compact project summaries. The reading area is approximately 930px wide within padded panels. All public-facing content is in English.

The homepage has four independent glass panels: profile, Recent work, Selected projects, and Latest posts. Contact links sit at the end of Latest posts. Individual experience and project rows do not create nested glass layers. Interior pages use a single `document-panel`; there is no full-page glass sheet. Navigation remains in normal document flow rather than floating over the content. Panel radii are 32px on desktop and 26px on mobile.

Wallpaper mode uses white text, translucent materials, a neutral contrast scrim, and thin edge highlights. Solid-background mode restores the standard light/dark document palette and hides the optical layers. [macOS Liquid Glass](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/) is the visual reference for the controls.

## Wallpaper and motion

The background uses eight original photographic lighting states from Apple’s Big Sur coastal wallpaper, extracted from the locally installed HEIC into `assets/img/big-sur/big-sur-N.jpg`. These are the original coastal photographs, not generated artwork or the abstract Big Sur Graphic wallpaper. Source details, export settings, frame hashes, and Apple’s original solar metadata are documented in [`assets/img/WALLPAPER.md`](assets/img/WALLPAPER.md).

The photographs are copyright Apple Inc. and are not covered by the repository’s MIT licenses. The website’s display schedule is a local-clock adaptation; it does not reproduce Apple’s solar-position scheduling or request the visitor’s location.

`assets/js/wallpaper.js` chooses frames using the visitor’s local hours and minutes:

| Local time, starting at | Period | Original HEIC frame |
| --- | --- | --- |
| 00:00 | Night | 1 |
| 05:00 | Dawn | 2 |
| 06:00 | Sunrise | 3 |
| 07:30 | Morning | 0 |
| 10:00 | Day | 4 |
| 16:30 | Late afternoon | 5 |
| 18:00 | Sunset | 6 |
| 19:00 | Dusk | 7 |
| 20:00 | Night | 1 |

Each period lasts until the next listed time, and the schedule repeats daily. It follows the browser’s current local clock and timezone rather than the site’s content timezone. The light/dark interface theme and wallpaper selection are independent. `assets/js/studio.js` stores the Wallpaper / Solid preference and manages the theme control.

The wallpaper settings panel supports a manual time through a keyboard-accessible slider, a native time input, and four scene presets. `harry-wallpaper-time` stores `auto` or a validated `HH:MM` value in local storage. Manual previews use the same frame schedule, persist across navigation, and stop the automatic clock. **Follow local time** restores automatic selection; **Show wallpaper** retains the solid-background option.

The current photograph loads first, then automatic mode preloads the next distinct photograph; manual mode loads only the selected photograph. CSS composites the three-second automatic crossfade, 0.8-second manual transition. A timer checks at minute boundaries, without a per-frame JavaScript loop or layout sampling. It stops during manual preview, while the document is hidden, or in solid mode, and updates immediately when automatic mode resumes. This also picks up local clock or timezone changes at the next check.

Reduced-motion preferences disable the crossfade, so scheduled frame changes are immediate. Reduced-transparency preferences hide glass effects and use opaque surfaces. Run `node scripts/check_wallpaper.cjs` to check the wallpaper schedule and lifecycle behavior.

## Liquid-glass implementation and attribution

The current renderer is the unmodified core module from [gentpan/liquidglass](https://github.com/gentpan/liquidglass), integrated by `assets/js/liquid-glass.js` and `assets/js/glass-controls.js`. The engine is byte-identical to the one bundled with the explicitly requested `liquid-glass-web` skill. It generates a rounded-rectangle optical field at the surface's actual aspect ratio. The curved-rim slope and refractive index (1.5) determine an inward displacement profile; RGB channels receive slightly different offsets. A specular mask follows the same rim normals. The engine includes WebKit-specific filter coordinate scaling and map decode/cache handling. Its `createSpring` helper drives compact controls; the site does not import the web-component bundle.

### Compact controls from the skill

`glass-controls.js` adapts pattern B from the skill's `references/patterns.md` and the navbar/switch/slider implementations in its `assets/components.js`. Native links, checkbox inputs, and the range input remain in place; decorative copies are hidden from accessibility and do not receive pointer events. The navigation indicator refracts only the matching label area, using a 5px bend, narrow bezel, and no chromatic split over its translucent fill. Switches and the time slider show solid thumbs at rest; while pressed, a small lens bends a copy of their track. Those lenses are destroyed after release and when settings close.

All these copies are local to their controls: no fixed-background images, scroll sampling, or geometry polling. Size is measured on resize, and spring frames run only until motion settles. Reduced motion disables thumb squish; reduced transparency or increased contrast removes the optical layers. Light panel tints and directional inset rims preserve the material appearance without filtering the text.

### Sources inspected for this revision

| Project | Implementation inspected | Decision |
| --- | --- | --- |
| [gentpan/liquidglass](https://github.com/gentpan/liquidglass/tree/068ad226f53e1ca62d857f78bdc32f58f3c5fce7) | `lib/liquid-glass.js`, especially `profileTable`, `renderLensMap`, `bendScale`, and `createGlass` | Use the unchanged core module for optical maps, filters, and WebKit fixes. |
| [Meapri/liquid-glass-web](https://github.com/Meapri/liquid-glass-web/tree/1613f8311dbc31bc2331afcfe51a143c56dd6308) | `LiquidGlass.ts` fixed-background fallback, `SurfaceField.ts`, `MapRaster.ts`, `FilterChain.ts` | Adopt the documented fixed-background integration principle. No source code from this project is copied. |
| [ybouane/liquidglass](https://github.com/ybouane/liquidglass/tree/59af227103795f06421a96e2c7d3dceb081decd2) | `shaders.ts`, `GlassRenderer.ts`, `HtmlCapture.ts` | Useful WebGL optics reference; its DOM capture pipeline is unnecessary for this site's known wallpaper. No code copied. |

### Wallpaper alignment and browser limits

On non-WebKit desktop engines, the filtered material paints the same two original wallpaper images as the page. CSS fixed background attachment, identical cover sizing/position, and shared opacity selectors keep those copies aligned during scroll and time-of-day transitions. The real wallpaper uses ordinary background attachment within its already-fixed viewport container.

Mac Safari can display this SVG refraction, but the full-panel filters over fixed image copies caused severe scrolling lag on this site. Safari/WebKit and iOS therefore use native 3px backdrop blur, a contrast tint, and inset edge highlights on large panels. The panel integration exits before creating wallpaper copies, panel lens SVGs, resize/intersection observers, or panel refresh callbacks. Only the separate compact controls use the shared engine there. Effects do not switch during scrolling. Reducing the displacement-map resolution alone does not reduce the full panel's filtered pixel area. SVG backdrop-filter limitations are tracked in [245510](https://bugs.webkit.org/show_bug.cgi?id=245510) and [297770](https://bugs.webkit.org/show_bug.cgi?id=297770); static rendering support is not evidence of acceptable scrolling performance.

Panel refraction applies only to the designated wallpaper; the compact navigation lens uses decorative label copies. No page content is rasterized. The glass integration has no scroll listener, screenshot capture, coordinate sampling timer, WebGL context, or continuous animation loop. JavaScript observes size, visibility, preferences, and wallpaper changes. The CSS wallpaper drift was removed so the page and filtered copies share exactly the same image geometry. Scheduled three-second crossfades and 0.8-second manual transitions are preserved.

iOS also avoids the unreliable `background-attachment: fixed` alignment. Reduced transparency restores opaque surfaces; reduced motion makes scene transitions immediate. In the enhanced renderer, off-screen surfaces, hidden pages, and solid mode release their filters. Upstream maps are cached and local map resolution is capped at 320,000 pixels per lens. `node scripts/check_glass.cjs` guards Safari/iOS selection, optional-module failure, and enhanced-renderer lifecycle.

| Surface | Maximum rim displacement | Frost | Curved edge width |
| --- | --- | --- | --- |
| Content panel | 28px | 1.5px | 28px |
| Navigation/footer | 20px | 0.75px | 18px |

Corners remain 32px for desktop panels, 26px for mobile panels, and 28px for the navigation. Chromatic separation is 0.035, deliberately subtle. Text is rendered normally above the lens with a neutral contrast tint behind it.

### Vendored code

- Source revision: `068ad226f53e1ca62d857f78bdc32f58f3c5fce7`.
- Source file: `lib/liquid-glass.js` → `assets/vendor/gentpan-liquidglass.js`, unchanged.
- SHA-256: `92a62e5b80cfa7e03912b13bdc53aff1c0ae367a5f296de1327e0f62f0579210`.
- MIT license retained as [`assets/vendor/gentpan-liquidglass.LICENSE.txt`](assets/vendor/gentpan-liquidglass.LICENSE.txt).
- No CDN, package installation, or React runtime is required.

The earlier `rdev/liquid-glass-react` texture and MIT notice remain in `assets/vendor/` for provenance, but the new engine does not load that texture. Their source snapshot was `ac48eab18d1f7f444ae30002d240cae29c863a21`; texture SHA-256 `6945d824fd543cb4bb080cf5a58460f29b17a661719ca10ccc718d953bfd7af6`. Preserve the retained MAX ROVENSKY copyright/license if redistributing those assets. All glass code licensing is separate from Apple's wallpaper artwork.

Other design references are [Motion](https://github.com/motiondivision/motion) and [Solar Dynamic Wallpaper](https://github.com/liddiard/solar-dynamic-wallpaper), both MIT licensed and neither a runtime dependency.
