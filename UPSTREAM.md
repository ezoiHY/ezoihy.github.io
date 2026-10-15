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

The homepage has three independent glass panels: profile, Selected projects, and Latest posts. Contact links sit at the end of Latest posts. Individual experience and project rows do not create nested glass layers. Interior pages use a single `document-panel`; there is no full-page glass sheet. Navigation remains in normal document flow rather than floating over the content. Panel radii are 32px on desktop and 26px on mobile.

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

The shared optical engine is the unmodified core module from [gentpan/liquidglass](https://github.com/gentpan/liquidglass), integrated by `assets/js/liquid-glass.js` and `assets/js/glass-controls.js`. The engine is byte-identical to the one bundled with the explicitly requested `liquid-glass-web` skill. It generates a rounded-rectangle optical field at the surface's actual aspect ratio. The curved-rim slope and refractive index (1.5) determine an inward displacement profile; RGB channels receive slightly different offsets. A specular mask follows the same rim normals. The engine includes WebKit-specific filter coordinate scaling and map decode/cache handling. Its `createSpring` helper drives compact controls; the site does not import the web-component bundle.

### Compact controls from the skill

`glass-controls.js` adapts pattern B from the skill's `references/patterns.md` and the navbar/switch/slider implementations in its `assets/components.js`. Native links, checkbox inputs, and the range input remain in place; decorative copies are hidden from accessibility and do not receive pointer events. The navigation indicator refracts only the matching label area, using a 5px bend, narrow bezel, and no chromatic split over its translucent fill. Switches and the time slider show solid thumbs at rest; while pressed, a small lens bends a copy of their track. Those lenses are destroyed after release and when settings close.

All these copies are local to their controls: no fixed-background images, scroll sampling, or geometry polling. Size is measured on resize, and spring frames run only until motion settles. Reduced motion disables thumb squish; reduced transparency or increased contrast removes the optical layers. A neutral contrast tint and directional inset rims preserve the material appearance without filtering the text.

### Sources inspected for this revision

| Project | Implementation inspected | Decision |
| --- | --- | --- |
| [gentpan/liquidglass](https://github.com/gentpan/liquidglass/tree/068ad226f53e1ca62d857f78bdc32f58f3c5fce7) | `lib/liquid-glass.js`, especially `profileTable`, `renderLensMap`, `bendScale`, and `createGlass` | Use the unchanged core module for optical maps, filters, and WebKit fixes. |
| [Meapri/liquid-glass-web](https://github.com/Meapri/liquid-glass-web/tree/1613f8311dbc31bc2331afcfe51a143c56dd6308) | `LiquidGlass.ts` fixed-background fallback, `SurfaceField.ts`, `MapRaster.ts`, `FilterChain.ts` | Adopt the documented fixed-background integration principle. No source code from this project is copied. |
| [ybouane/liquidglass](https://github.com/ybouane/liquidglass/tree/59af227103795f06421a96e2c7d3dceb081decd2) | `shaders.ts`, `GlassRenderer.ts`, `HtmlCapture.ts` | Useful WebGL optics reference; its DOM capture pipeline is unnecessary for this site's known wallpaper. No code copied. |

### Wallpaper alignment and browser limits

The non-WebKit panel renderer follows patterns C/E from the explicitly requested `liquid-glass-web` skill. `assets/js/glass-wallpaper.js` adapts the skill's `assets/glass-webgl.js`: it reuses `renderLensMap` from the unchanged shared engine and the same per-channel bend. Panel specular output is disabled on the renderer; one directional CSS border supplies the highlight attached to the card. No page content or project video is captured.

Each glass host owns an absolute transparent WebGL canvas as its first decorative child, below the frost, shade, text, and CSS rim. Its CSS size and radius follow that host, whose `overflow:hidden` is the final shared silhouette mask. The fixed wallpaper has no optical canvas. Each visible or nearby card lazily creates a renderer that draws four rim strips directly into that canvas at local `(0, 0)`; `uOrigin` affects only the cover-aligned photo sample. There is no intermediate scratch canvas, WebGL-to-2D output copy, `readPixels`, DOM capture, worker, or asynchronous bitmap swap.

This ownership keeps the optical outline attached to its card. The former shared WebGL canvas and synchronous `drawImage` copies added a costly transfer path on every scroll update. Direct drawing removes that path. Photographs are decoded and downsampled once to at most 1536px on each side, shared as upload sources; each card context caches its own GPU photo textures and map. The homepage has five possible contexts and ordinary pages have three; off-screen cards create no context until they enter the 80px prewarming margin.

Normal scroll and visual-viewport scroll events submit the current sampling coordinates immediately, cancelling an already queued frame rather than deferring the sample through another animation-frame request. Geometry, optical maps, photo uploads, and bitmap dimensions do not change on a normal scroll. The root engine attribute is only written when its value changes, avoiding a repeated document-wide style invalidation. The fixed background and native Safari compositor can still move ahead of main-thread JavaScript during asynchronous gestures; this implementation reduces the rendering path and does not promise zero compositor latency.

At rest there is no permanent loop. Active CSS photo transitions and bounded 450ms edge-gesture pulses request additional sampling frames. The same material remains visible through a cancelled pull and subsequent downward scrolling; do not restore the former hide/reveal workaround. Native scrolling and pull-to-refresh are retained. The skip link uses clipping rather than an off-screen transform, with a visible keyboard-focus state.

This GPU path replaces the old full-panel SVG filters over viewport-fixed image copies, which caused severe scrolling lag in Safari. It remains active in Chromium and Firefox when WebGL is available. Safari/WebKit takes the native path below because even the direct renderer cannot keep main-thread photo samples in step with fast asynchronous scrolling. No `background-attachment: fixed` image copies remain. If the module or GPU is unavailable, or the context is lost, a CSS material with 2px blur, the same readable tint, and inset highlights remains. This fallback has no actual displacement. Context restoration re-enables the renderer.

Reduced transparency and increased contrast restore opaque surfaces and release the renderer. Hidden pages and solid mode delete every card renderer’s photo textures, maps, buffers, and shader program. Off-screen lenses are omitted from drawing; already created contexts and their resources stay cached to avoid expensive rebuilds on re-entry. Optical maps are capped at 320,000 pixels and the GPU texture length limit. Each direct framebuffer is capped at two million pixels, a density of 1.5 times CSS pixels, and GPU viewport/renderbuffer length limits. Release also shrinks every card buffer to one pixel. `node scripts/check_glass.cjs` guards the integration lifecycle; it does not measure GPU rendering or scrolling frame rate.

| Surface | Maximum rim displacement | Frost | Curved edge width |
| --- | --- | --- | --- |
| Content panel | 28px | 2px | 24px |
| Navigation/footer | 18px | 2px | 16px |
| CSS panel fallback | None | 2px | CSS highlight |
| Search/settings | None | 0.75px | CSS highlight |

The shader measures inward distance from the rounded-rectangle silhouette and fades optical opacity from full at 40% of the curved band to zero at its inner edge. This continuous transition finishes before the four drawing strips end, avoiding a hard inner photo boundary. Premultiplied alpha is preserved. Corners remain 32px for desktop panels, 26px for mobile panels, and 28px for navigation. Curvature is 4 and chromatic separation is 0.1. Canvas specular strength is 0; the single 1px CSS highlight runs from 55% white on the lit corner to a subdued opposite edge, without stacked bright inset outlines. The requested 10% frost maps to 2px native background blur on a 0–20px design scale; it applies with or without the GPU rim. Text remains unfiltered.

One neutral `rgb(8 15 24 / .10)` tint covers the entire card under the content, with the host’s radius and no inset tint, smaller inner radius, or halo. The rim and centre share the same tint and 2px frost. The owner requested a 10% dark mask and 10% frost after reviewing the earlier stronger tints. Text remains unfiltered, with a compact dark shadow and dark hover/selection fills. The lighter default does not guarantee 4.5:1 over an arbitrary white background; actual contrast depends on the photograph. Reduced transparency or increased contrast uses opaque `#202a35`, which preserves at least 4.5:1 for all wallpaper text tokens independently of the photo.

### Safari/WebKit native scrolling material

Fast Safari scrolling still visibly outran both the shared-canvas adapter and the later direct per-card adapter. WebKit also has an open [SVG filter plus backdrop-filter limitation](https://bugs.webkit.org/show_bug.cgi?id=297770), so filtering a live native backdrop does not provide a supported continuous-displacement replacement. The WebKit branch now returns before loading the wallpaper GPU adapter, creating a canvas, decoding a sampling photo, or installing any scroll/viewport sampling listeners.

Each host instead owns a `liquid-native-optics` wrapper with a rounded `clip-path`. Its four narrow edge clips each contain the existing A/B photo sources, positioned `fixed; inset:0` in viewport coordinates. Only these fixed sources receive a static transform: up/left/right/down offsets approximate the corresponding rim direction, 6px over a 12px band on panels and 4px over 8px on bars. An inward alpha gradient softens the join; the separate native 2px frost, uniform 10% shade, and single DOM highlight remain. This is a reduced, four-direction visual approximation, **not** the shared engine's continuous optical field or chromatic separation.

No JavaScript coordinate update runs during Safari scrolling. The browser composites the moving clip and fixed source. Keep the card and clip ancestors free of `transform`, `filter`, `backdrop-filter`, or containment that would change the fixed source's containing block. Frost must remain a later sibling, never an ancestor. The source uses the same viewport bounds, cover alignment, CSS image variables, A/B opacity selectors, and crossfade timing as the actual wallpaper. Do not use `background-attachment:fixed` or a full-panel SVG filter here. Reduced-motion rules must keep the static source offsets; reduced transparency, increased contrast, solid mode, and print hide the whole decorative wrapper.

### Vendored code

- Source revision: `068ad226f53e1ca62d857f78bdc32f58f3c5fce7`.
- Source file: `lib/liquid-glass.js` → `assets/vendor/gentpan-liquidglass.js`, unchanged.
- SHA-256: `92a62e5b80cfa7e03912b13bdc53aff1c0ae367a5f296de1327e0f62f0579210`.
- MIT license retained as [`assets/vendor/gentpan-liquidglass.LICENSE.txt`](assets/vendor/gentpan-liquidglass.LICENSE.txt).
- The site-specific WebGL adapter is derived from the `liquid-glass-web` skill's `assets/glass-webgl.js`; it is kept separate from the unchanged engine and covered by the retained MIT attribution.
- No CDN, package installation, or React runtime is required.

The earlier `rdev/liquid-glass-react` texture and MIT notice remain in `assets/vendor/` for provenance, but the new engine does not load that texture. Their source snapshot was `ac48eab18d1f7f444ae30002d240cae29c863a21`; texture SHA-256 `6945d824fd543cb4bb080cf5a58460f29b17a661719ca10ccc718d953bfd7af6`. Preserve the retained MAX ROVENSKY copyright/license if redistributing those assets. All glass code licensing is separate from Apple's wallpaper artwork.

Other design references are [Motion](https://github.com/motiondivision/motion) and [Solar Dynamic Wallpaper](https://github.com/liddiard/solar-dynamic-wallpaper), both MIT licensed and neither a runtime dependency.
