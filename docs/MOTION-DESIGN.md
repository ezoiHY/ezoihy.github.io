# Interaction motion

Reviewed and implemented on November 16, 2026.

## References and decisions

- [DesignBookmark Motion](https://designbookmark.com/motion): the Navigation examples, including Tab pill and Smooth tab, informed the continuous selection surface. The existing text navigation remains visible and keeps its original labels.
- [Bencho Tab bar](https://bencho.dev/blocks/tab-bar): a shared tile preserves continuity between choices. This site uses a restrained sliding background in desktop navigation and an underline in project filters, with no expanding labels or elastic overshoot.
- [Motion animation guide](https://motion.dev/docs/react-animation): entrance, exit, and interrupted transitions informed the panel lifecycle. Implementation uses native browser animations rather than adding React or an animation dependency to Jekyll.

These are design references. The implementation is original site code; no component source, fonts, or external runtime was copied or loaded.

## Behavior

| Interaction | Response |
| --- | --- |
| Desktop navigation | One background follows pointer hover or keyboard focus, then returns to the current page. |
| Project filters | The underline follows the selected button, including wrapped rows. Visible cards move from their previous positions; newly visible cards fade in over a 6px displacement. |
| Search and wallpaper dialogs | A 240ms entrance and 140ms exit, with small translation and scale. Native dialog focus containment and Escape remain supported. |
| Mobile navigation | Height, opacity, and bottom padding expand together. Closing removes links from keyboard interaction immediately. |
| Theme button | Sun and moon exchange through opacity, rotation, and scale. |
| Buttons | Brief uniform press scaling, with hover treatments restricted to a fine pointer. |

The motion tokens in `assets/css/studio.css` are `--motion-fast: 140ms`, `--motion-standard: 240ms`, and `--motion-ease: cubic-bezier(.22, 1, .36, 1)`. Keep duration tokens in milliseconds because `studio.js` reads the numeric standard duration.

`assets/js/studio.js` owns interruptible Web Animations API transitions. It measures the current visual position before redirecting a running transition, cancels stale callbacks, and applies the final semantic state independently of decorative motion. Filter results and their live status update immediately. Offscreen cards do not animate.

Reduced motion disables CSS transitions and press transforms, skips new browser animations, and settles any running browser animations when the preference changes. Browsers without `Element.animate` apply states immediately. Content is never hidden behind a scroll reveal, and video previews still require an explicit Play action.

## Validation

- Jekyll build and the site checker: 16 HTML pages, 14 required routes, local links/fragments, and search indexes.
- al-folio override audit: all three layout overrides remain acknowledged; no gems or layout files changed in this revision.
- Existing wallpaper unit suite: all 13 checks passed.
- Ego Chromium browser checks: desktop 1440px and mobile 390px, light/dark screenshots, navigation highlight alignment, search and keyboard focus return, wallpaper controls, theme switching, mobile menu, all six project filters, and repeated rapid selection.
- Edge cases: interrupted dialog close/reopen, native close followed by immediate reopen, repeated menu toggles, reduced motion at load and while an animation is running, and filter underline alignment at 320px with wrapped buttons.

Browser checks are local Chromium observations, not cross-browser or production performance measurements. The 930px reading area, content, routes, media framing, and static page navigation remain unchanged.
