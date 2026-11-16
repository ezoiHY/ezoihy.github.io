# Personal site audit and performance revision

Audit started November 4, 2026; final revision November 5, 2026 (Asia/Shanghai).

The site keeps its al-folio academic structure, approximately 930px reading area, real identity, experience, dates, project evidence, and existing routes. The owner's selected direction is **landscape wallpaper with lighter glass and less motion**. The landscape remains enabled by default; a saved solid-background preference is respected.

## Findings and changes

| Priority | Finding | Resolution |
| --- | --- | --- |
| High | A fresh homepage loaded both the current and next 2560px wallpaper. In the measured night scene these were 1,896,204 bytes, 65.9% of resource transfer. | Load only the selected frame. Serve a 960px WebP on mobile or 1600px WebP on desktop, asynchronously at low priority. Keep original source files and provenance. |
| High | Chromium created six canvases. The optical implementation read layout and sampled the photograph on scrolling; WebKit instead created multiple fixed photo copies per panel. | Stop loading all optical modules. One fixed image pair handles occasional CSS crossfades. No canvas, scroll sampling, optical maps, or duplicated panel photographs. |
| High | Wallpaper mode forced white text over sky and terrain and overrode the light/dark document palette. | Preserve theme colors on 96% opaque reading surfaces. Limit CSS blur to header/footer. Opaque accessibility surfaces and print backgrounds override the wallpaper correctly. |
| Medium | A 209 KB portrait and large source screenshots were used in small display areas. | Responsive portrait variants are 21 KB / 55 KB; six 800px thumbnails and two small university marks reduce transfer. Original project photographs/screenshots remain available in project details. |
| Medium | Six projects were hidden behind a rotating carousel; videos could start automatically during browsing. | Show all six projects in a static list; request video only after Play preview. Shorten the mobile portrait area by placing affiliations beside the photo. |
| Medium | Biography repeated affiliations and ended with broad aspiration rather than concrete work. | Tighten the homepage narrative and About page; connect research interests to actual projects, distinguish simulation from physical demonstrations, and link the software tools. |
| Medium | A search field consumed the first Escape to clear text, although the dialog said Escape closes it. | Explicitly close the dialog on Escape from the input. |
| Medium | Mobile navigation was unavailable without JavaScript. | Expose ordinary navigation links through a no-script style fallback. |

The research navigation label now matches a page containing research interests and an empty publications list. `/publications/` and `/papers/` remain intact. The introductory post retains its original date and `/posts/hello-world/` URL, with a clearer title and less repeated prose. The historical Astro post remains explicitly historical.

## Measurement method

Measurements compare a preserved pre-change Jekyll build with the updated local build, served by the same uncompressed Python HTTP server. Chromium uses fresh browser contexts, device scale factor 1, Asia/Shanghai time, desktop 1440×1000 and mobile 390×844 viewports. Resource timing is collected after network idle plus 1.2 seconds, before the full-page screenshot. The baseline scene is night; the next-scene prefetch was dawn.

Transfer includes resource response headers reported by Chromium, and excludes the main HTML document. Lazy-image requests depend on viewport and distance from the current scroll position. These are controlled local measurements, not production Core Web Vitals or mobile-device frame-rate results. Local LCP is too fast and environment-dependent to support a loading-speed claim. No claim of universal frame rate or GPU-memory measurement is made.

| Metric | Previous desktop | Revised desktop | Previous mobile | Revised mobile |
| --- | ---: | ---: | ---: | ---: |
| Initial resource transfer (bytes) | 2,877,051 | 321,431 | 2,877,051 | 248,855 |
| Transfer reduction | — | 88.8% | — | 91.4% |
| Canvases | 6 | 0 | 6 | 0 |
| Observed long tasks, light theme | 51 ms, 120 ms | None | 74 ms | None |
| Cumulative layout shift | 0 | 0 | 0 | 0 |

Both light and dark themes were measured. These revised figures include the default night wallpaper, rather than a solid-background-only comparison. A bright daytime scene has a different encoded size. The complete browser matrix passed **30/30 checks**. Chromium was exercised locally; Safari/WebKit and Firefox were not installed in this environment and are not claimed as tested.

The previous two 2560×2560 images alone imply about 50 MiB of uncompressed RGBA pixels, before duplicate GPU textures. This is an estimate from image dimensions, not a measured memory reading. Removing the optical module also removes the per-card rendering and texture path, regardless of the network improvement.

## Verification

- Jekyll build with the existing Ruby 3.4 runtime and pinned gems.
- Site-output check: 16 HTML pages, 14 required routes, 794 local links/SVG references, 16 search indexes.
- Wallpaper tests cover time boundaries, manual selection, hidden/solid lifecycle, image failures, stale requests, and mobile image selection.
- CSS contrast check evaluates actual light/dark panel colors against black and white photographic extremes; primary, secondary, muted, and link tokens reach 4.5:1 on reading panels.
- Browser checks cover desktop/mobile in both themes, four wallpaper scene presets, preference persistence, search and keyboard navigation, menu, project filtering, deliberate video playback, reduced motion, no JavaScript, and 320px route overflow.
- Print and reduced-transparency checks cover dark-theme wallpaper mode.
- Local al-folio overrides are acknowledged; no gem or plugin activation changed.

The old optical and carousel source files remain for provenance. They are not imported by the layout. Their historical lifecycle tests do not measure current scrolling performance. `scripts/check_browser.cjs` provides the real-browser regression checks; `scripts/check_wallpaper.cjs` provides deterministic timing and loading checks. `scripts/optimize_media.py` regenerates delivery images with Pillow; it is not a build-time dependency.

## Content work requiring actual records

The remaining content gaps are evidence gaps, rather than copy-editing gaps:

1. **Underactuated hand:** retain the documented 304 g mass and single actuator. Add object types, trial counts, load conditions, wet/underwater test conditions, failure modes, and measured grasp outcomes when records are available. “Verified stable grasping” is currently a qualitative statement.
2. **Hand retargeting:** document input setup, simulated robot, latency and error measures, supported gestures, and difficult cases. Keep the current simulation boundary explicit.
3. **Robotic fish:** distinguish the author's visual-recognition/tracking contributions from the wider student project. Add dataset and evaluation conditions when known; do not infer detection accuracy or diver-tracking success from the photograph.
4. **Language-controlled quadruped:** record model version, instruction examples, action mapping, latency and observed failures from the actual implementation. A demonstration video does not establish general reliability.
5. **Writing:** the two current posts introduce the blog and document its old implementation. One substantive project log or paper-reading note would provide more evidence of research thinking than more introductory copy.
6. **Software projects:** preserve screenshot provenance and synthetic-data notices. When publishing a new revision, update repository references and screenshots together.

No publication, benchmark, achievement, test result, date, or personal detail was invented to fill these gaps. The approved CV data and downloadable PDF are unchanged. No deployment or Git push was performed.
