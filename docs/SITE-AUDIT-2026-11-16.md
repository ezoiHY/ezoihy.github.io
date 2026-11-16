# Personal site usability review — November 16, 2026

This review follows the homepage/research presentation and motion revisions. It preserves the 930px reading layout, pinned al-folio gems, English content, verified personal information, and separate attribution of PAIRS Lab demonstrations.

## Findings addressed

| Finding | Result |
| --- | --- |
| Search only matched titles and short descriptions | Published body text, tags, categories, and relevant profile/research data are indexed; title matches rank first. Qwen, HaMeR, and YOLOv8 find their projects. |
| Search input had no visible keyboard focus and used small mobile text | An explicit focus outline and 16px input remain in both themes; the result count is announced separately from result contents. |
| Several mobile links and filters were hard to tap | Relevant standalone actions now have a minimum 44px touch area. |
| Reduced-transparency/high-contrast settings missed dialogs and solid mode | Content, toolbar, footer, and dialog surfaces become opaque in both backgrounds and themes. |
| Project sharing always used the portrait | Project metadata uses each project's source image and alt text. Optional share-specific fields remain available. |
| Project heading levels did not reflect their grouping | Project grid titles are h2; homepage project titles are h4 under h2 section and h3 group headings. |
| The CV plugin omitted its configured GitHub account | A visible Email/GitHub navigation reads the existing profile data. |
| `/papers/` duplicated the canonical destination | It points its canonical and Open Graph URL to `/publications/`, retaining its redirect and no-JavaScript link. |
| Playback failures or stalled requests could leave unusable controls | Both personal previews and lab demos provide cancellation, 20-second pending-request timeouts, visible failure messages, and deliberate retry. Stale promises cannot overwrite newer requests. |
| Filters and print/copy controls remained visible without JavaScript | Inactive controls are hidden; ordinary navigation, project content, and download links remain available. |

## Validation

- Jekyll build and `scripts/check_site.py`: 16 HTML pages, 14 required routes, local links/fragments, and all embedded search indexes pass.
- Existing wallpaper, glass, and project-carousel checks pass. Carousel/optical checks cover retained modules; the live homepage uses static project rows.
- Desktop 1440px and mobile 390px, both themes: no horizontal overflow; search, keyboard result navigation, Escape, mobile menu, and project filters work. A project page also fits 320px.
- Search queries checked in the real browser: Qwen, HaMeR, YOLOv8, PaperNAS, Huawei, wrist, and a no-results query.
- Both reduced-transparency and increased-contrast settings: opaque, unblurred surfaces in both themes and backgrounds.
- No JavaScript: all six project cards and mobile navigation remain accessible; inactive filters and print controls are hidden; `/papers/` provides its fallback link.
- Print emulation: CV toolbar is hidden and content uses a white background.
- Personal preview: a missing source shows an error; a corrected source can retry; a pending load can cancel. At 700px, error text and retry control do not overlap.
- Lab playback: concurrent muted loops, end-to-start looping, persistent manual pause, offscreen pause, reduced-motion behavior, pending cancellation, the actual 20-second timeout, and recovery from a failed source pass. The timeout uses a deliberately unresolved play request; retry is then verified against real video playback.

Browser screenshots and local measurements are under `test-results/deep-2026-11-16/` (ignored by Git). They are local laboratory observations, not a production Core Web Vitals assessment or cross-browser certification. No publication/deployment is part of this review.

## Most useful next content improvement

The strongest next step is to make the existing project evidence easier to evaluate. Each project can use a short, consistently structured account of the problem, the owner's contribution, the validation method, and the observed result. Add new accuracy/latency/grasp-success figures only when backed by actual measurements and test conditions. Hardware footage and simulation screenshots should remain clearly distinguished.

The CV plugin's internal heading hierarchy is still upstream-generated. Replacing that renderer solely to change heading levels would add a new maintained override; the existing visible document remains usable. A future CV-specific revision can address that structure together with print layout, without changing its underlying facts.

## Personal-site references and home navigation

The following personal pages were reviewed in the browser on November 16, 2026:

| Reference | Observed pattern | Application to this site |
| --- | --- | --- |
| [Shuran Song](https://shurans.github.io/) | An explicit HOME navigation link. | Home is now the first desktop and mobile navigation item. |
| [Jon Barron](https://jonbarron.info/) | Research entries pair imagery, short descriptions, and resource links. | Keep project evidence and its relevant links together in the existing academic rows. |
| [Ashish Kumar](https://ashish-kmr.github.io/) | Live Demos include concise descriptions of the setup and demonstrated behavior. | Future demo descriptions should explain the visible task and conditions using verified facts. |
| [Haozhi Qi](https://haozhi.io/) | Profile resource links are directly accessible, and older news can be expanded. | Keep primary profile links visible; consider collapsing older updates only when the list grows. |

The reference sites inform the recommendations, rather than supplying copied layouts or content. This navigation revision adds a visible Home breadcrumb to every interior page and a Back to home footer link. Project and post breadcrumbs include their parent collection; project links retain the current filter and view context. The existing brand link remains available, with a Back to home tooltip. Redundant standalone parent links in project and post headers were removed. Navigation marks only exact URL matches as the current page; a detail page's parent section retains its visual highlight with a generic current-item state.

Validation: the build and site checker pass for 16 HTML pages, 14 required routes, 932 local links/fragments, and 16 search indexes. Layout checks at 320, 390, 760, 761, 800, 960, and 1440px found no horizontal overflow. Desktop and mobile Home navigation, breadcrumb and footer returns, active-page state, project filter context, and search/Escape pass in local Chromium. Desktop/mobile screenshots cover both themes. A mobile breadcrumb also returns home with JavaScript disabled. Screenshots are in `test-results/home-nav-2026-11-16/`; the al-folio override audit passes.
