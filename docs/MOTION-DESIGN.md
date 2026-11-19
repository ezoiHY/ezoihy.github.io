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

## Details layer — November 19, 2026

A second pass adds personality without decoration for its own sake. The language is a quiet instrument readout: monospace annotations, hairlines, a reticle and a kinematic arm, all drawn from the owner's work in sensing and manipulation. Everything is original site code with no new dependency, font or CDN.

| Interaction | Response |
| --- | --- |
| First page of a visit | The header drops in, the homepage introduction rises in sequence, and the portrait comes into focus (scale and blur settle). Interior pages rise as two blocks. A `sessionStorage` flag (`harry-intro`) limits this to the first page per session; the attribute is removed after 2.6s so hover transforms are never held by a filled animation. |
| Theme toggle | The new palette expands as a circle from the toggle through a same-document View Transition (560ms). Without View Transitions, or with reduced motion, the theme changes at once. |
| Portrait (pointer only) | Corner brackets close in, a scan line passes once, and a reticle follows the cursor with normalized `x`/`y` coordinates. Hidden on touch devices. |
| Project imagery | Images settle from 1.07× to their frame as they scroll into view (CSS `view()` timelines where supported); text is never hidden or delayed. On hover, images lean in slightly and a spec readout shows the project's measured `highlights`. |
| Lead project | A soft light and a lit edge follow the pointer across the plate. |
| Section headings | A numbered eyebrow draws its hairline once when it enters view. |
| Timeline | Lines draw from left to right once in view, then labels fade in. Hovering an appointment (or focusing a link inside it) highlights its bar and dims the rest; the pointer shows a date scrubber over the axis, which scrolling clears. |
| Homepage section navigator | A single pill slides to the section in view. |
| Long pages | A 2px reading-progress line follows the scroll position (CSS `scroll()` timeline, or a passive listener where unsupported or with reduced motion). |
| Feedback | Copy actions show a toast in the top layer (manual popover) and announce the message through a separate polite live region. |
| 404 page | A planar three-link arm solves inverse kinematics (FABRIK) toward the pointer and reports its joint angles. After 2.6s without input its target drifts along a slow figure eight; out-of-reach targets turn amber. The loop stops while the stage is off screen or the tab is hidden. |

Reduced motion removes the intro, reveals, scroll-linked media, hover lean, theme reveal, idle drift and smoothing; every element starts in its final state and the reticle and arm still follow direct pointer input. No-JavaScript pages keep the timeline drawn and hide controls that need a script (clock, copy, shortcuts, toast, the 404 arm). Print hides decorative layers. Increased contrast and forced colors remove the lit surfaces and the sliding pill.

### Validation

- Jekyll build and `scripts/check_site.py`: 16 HTML pages, 14 required routes, all local links and search indexes.
- Existing unit suites: wallpaper 13/13, glass 13/13, carousel 11/11. `scripts/check_portfolio_flows.cjs`: 7/7.
- `scripts/check_browser.cjs`: the search check now expects navigation links followed by commands, and the theme check waits one frame for the View Transition.
- Scripted Chromium checks: command ranking and keyboard movement across links and buttons, copy with clipboard and toast, `?` and Escape, `T`, shortcuts ignored while typing, `G` then `P`, reading progress at half scroll, section anchors, the 404 arm in and out of reach, the first-visit sequence and its single play per session, reduced motion, no JavaScript, and touch emulation (no tracker, readout, scrubber, lit surface or shortcut hints).

## Light — November 19, 2026

The background light was rebuilt around Apple's published guidance: [Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) (Liquid Glass) and the [Liquid Glass announcement](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/) of June 2025. The guidance is paraphrased below; the implementation is original site code.

| Guidance | Applied here |
| --- | --- |
| Motion should support the experience, not overshadow it. | Only light moves. The reading panels carry a soft pool and one glossy sheen; reading pages use 72% strength, and the sheen is strongest only when a low sun would rake the glass. |
| Give people a stationary frame of reference; avoid motion at the edges of the view. | The photograph no longer pans or zooms. The margins change only in luminance. |
| Avoid sustained oscillation, especially around 0.2 Hz. | The 8–15s back-and-forth sweeps are gone. Each layer breathes and drifts on its own 30–75s period per axis (full cycles of 30–150s), with amplitudes of at most 2.4%. Every cycle divides one hour, so the composite repeats at most hourly and the clock phase stays continuous across its hourly wrap. |
| Motion should be realistic and follow expectations. | One sun, interpolated from Apple's own solar samples for these frames (`apple-solar.json`), lights everything. The camera looks up the coast, so sunrise light enters from the land on the right and sunset light from the ocean on the left; midday light is diffuse. Previewing a time moves the sun with a 1.4s glide. |
| Liquid Glass belongs to the control layer, reflects its surroundings, shows specular highlights that react to movement, and should be used sparingly. | Only the toolbar and the homepage section navigator get a specular edge. It reflects the sky's hue, has sun-tinted light just beneath it, and leans toward a nearby mouse or pen. Content panels keep a standard material with a still 1px top highlight. |
| Make motion optional. | The wallpaper switch is now **Animate light**. Reduced motion keeps the light visible and completely still, with no pointer response. Reduced transparency, increased contrast and forced colors remove the light layers. |

Two further details follow Apple's habits rather than a specific rule. The inline head script sets `--ambient-t` from the clock and every light animation uses it as a negative delay, so the light continues across navigation instead of restarting (measured phase error 0.04s between Home and About). And like macOS Sonoma's aerial wallpaper, which moves on the lock screen and comes to rest on the desktop, the scenery settles into place once, on the first page of a visit, then holds still while you read.

`light.js` writes the sun's custom properties only when they change, refreshes every five minutes in automatic mode and immediately when the previewed time changes, never installs a scroll listener, and runs a frame loop only while the pointer response settles. CSS registers the sun properties with `@property` so changes glide; the first values apply without a transition.

### Validation

- `scripts/check_light.cjs` (7 tests): sun direction at sunrise, sunset, midday, dawn and night; westward motion through the day; instant first values; previews override the clock and unchanged values are not rewritten; one slow timer only in automatic mode, cancelled while hidden; the specular edge on the sun's side; pointer response only with a fine pointer and motion allowed.
- `scripts/check_browser.cjs` now expects the photograph to stay still while the sky light and both reflection layers move; every still mode (motion off, reduced motion, high contrast, solid background, hidden tab) keeps all four layers still. 43/43 checks pass.
- Captures at 06:00, 12:00, 18:00 and 22:00 in both themes on the homepage, Projects, a post and a 390px phone; reduced motion shows the light with no running animation.

## Research map — November 19, 2026

The research-interest map moved from bordered boxes and grey curves to an instrument-like diagram, keeping its content, order, routes and behavior.

| Element | Treatment |
| --- | --- |
| Core | A tick ring, a loop track with three stations, and a signal that circles once every 12s; Perception, Learning and Action light in the legend as it passes each station. |
| Filaments | Leave the core radially and turn level into a port on each card. A short light pulse travels each branch, one branch every 1.8s on a 9s cycle; the active branch streams every 2.4s. |
| Cards | Line icon, mono index, title, description and link chips on a lightly tinted surface; the pointer light from the homepage lead project follows the cursor. |
| Shared evidence | Topics citing the same page are joined by a dashed arc on an orbit around the core while either is active; the dashes flow, and the partner card names the shared work on a tab outside the layout flow. |
| Selection | The selected card's icon and port fill with the accent and its context fades in over 360 ms. Other cards recede through their border, icon and port only; their text keeps full contrast. |

The orbit, pulses and chord flow run only while the map intersects the viewport (`is-visible`), and none run with reduced motion; the map stays fully drawn. Increased contrast removes the dot field, pulses and sweep. No layout depends on animation: tabs are absolutely positioned and pulses are drawn on separate paths.

Validation: `scripts/check_portfolio_flows.cjs` 7/7 (topic selection, Back/Forward, hub reset, no-JS contexts on desktop and mobile); `scripts/check_browser.cjs` 43/43 including 320px overflow; scripted Chromium checks for animations pausing off screen, keyboard focus showing the linked partner and its tab, reduced motion with no running animation, no-JS with all five contexts visible and no ports, and two-column print.

## Review pass — November 19, 2026

A full review of this revision fixed the following: the timeline axis and prelude are derived from the data (a 2028 date or build no longer overflows the chart); light periods now divide one hour so the clock phase survives its hourly wrap; inactive research cards no longer dim their text below WCAG AA; reading-time text no longer uses reduced opacity (now at least 4.5:1); the toolbar edge reads layout once per frame instead of forcing it; switching motion off returns reflections and the edge to rest; keyboard focus keeps its timeline highlight when the pointer passes; the 404 arm's idle drift actually starts and pauses off screen; the tracking readout hides on portraits too narrow to hold it. CI now runs the wallpaper, light, glass and carousel unit suites before deploying.

