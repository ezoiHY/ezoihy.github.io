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

The current photograph loads first, then automatic mode preloads the next distinct photograph; manual mode loads only the selected photograph. CSS composites the three-second automatic crossfade, 0.8-second manual transition, and a 75-second low-amplitude drift. A timer checks at minute boundaries, without a per-frame JavaScript loop or layout sampling. It stops during manual preview, while the document is hidden, or in solid mode, and updates immediately when automatic mode resumes. This also picks up local clock or timezone changes at the next check.

Reduced-motion preferences disable the drift and crossfade, so scheduled frame changes are immediate; they also disable pointer-driven glass rim changes. Reduced-transparency preferences hide glass effects and use opaque surfaces. Run `node scripts/check_wallpaper.cjs` to check the wallpaper schedule and lifecycle behavior.

## Liquid-glass implementation and attribution

`assets/js/liquid-glass.js` is a native DOM port of the material in `src/index.tsx` from [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react). It adapts implementation code, including the SVG RGB filter and twin screen/overlay rim treatment. React is not a runtime dependency.

The implementation uses the original standard displacement JPEG and the browser’s actual backdrop. RGB channels are displaced separately and recombined with an edge mask. CSS provides native backdrop blur and saturation, while two masked 1.5px rims use `screen` and `overlay` blending. Foreground content remains in the normal semantic DOM.

| Surface | Base displacement magnitude | Blur | Saturation |
| --- | --- | --- | --- |
| Content panel (`panel`) | 100 | 16px | 140% |
| Navigation/footer toolbar | 64 | 7.2px | 130% |

Safari and Firefox retain native backdrop blur but do not show SVG displacement, as documented by the upstream project. The local implementation selects this native fallback explicitly. It does not emulate refraction using a wallpaper copy. The glass port has no scroll-sampling handlers, sampling timers, canvas-generated displacement maps, or DOM snapshots. Its JavaScript responds to resize, theme changes, and pointer input; the browser owns backdrop compositing during scroll. This is separate from the minute-boundary wallpaper-selection timer described above.

### Code and texture provenance

- Upstream source snapshot: `ac48eab18d1f7f444ae30002d240cae29c863a21`.
- Copyright: **2025 MAX ROVENSKY**, MIT license.
- Upstream `displacementMap.jpg` is retained unchanged as `assets/vendor/liquid-glass-displacement.jpg`.
- Displacement texture SHA-256: `6945d824fd543cb4bb080cf5a58460f29b17a661719ca10ccc718d953bfd7af6`.
- The upstream license is retained unchanged as [`assets/vendor/liquid-glass-react.LICENSE.txt`](assets/vendor/liquid-glass-react.LICENSE.txt), with the copyright and permission notice intact.

Preserve this attribution and license when modifying or redistributing the port or texture. The glass port and texture are separate from the Apple wallpaper assets.

Other design references, used for ideas rather than copied runtime code, are [Motion](https://github.com/motiondivision/motion) and [Solar Dynamic Wallpaper](https://github.com/liddiard/solar-dynamic-wallpaper), both MIT licensed. Neither is a runtime dependency. The UI/UX Pro Max and Frontend Design skills were used to review contrast, consistency, touch targets, and restrained motion.
