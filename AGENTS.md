# Harry Han's personal al-folio site

This is a **user-owned site**, based on al-folio v1, not the upstream starter.
The intentional local layout and style overrides preserve al-folio's academic layout with lightly translucent controls.
See `UPSTREAM.md` and `docs/AL-FOLIO-ARCHITECTURE.md` before upgrading gems.

## Develop and verify

- Ruby 3.4, Bundler: `bundle install`, then `bundle exec jekyll build`.
- Preview: `bundle exec jekyll serve --host 127.0.0.1 --port 4000`.
- Verify site output: `python3 scripts/check_site.py`.
- Audit overrides: `bundle exec al-folio upgrade overrides audit`.
- Keep dependency pins in `Gemfile` and activation in `_config.yml` aligned.
- Check desktop/mobile, both themes, search, menu and filtering after UI changes.

## Content and design

- Preserve the user's real identity, projects, dates and achievements. Never invent publications or life details to fill space.
- Keep all public-facing content and UI text in English. Use a 930px document layout, conventional headings and restrained styling.
- Personal data: `_data/profile.yml`; CV: `_data/cv.yml`; projects/posts: Markdown; publications: BibTeX.
- Diagrams are conceptual illustrations, not physical project photos or validated engineering drawings.
- Honor reduced motion and keep glass surfaces readable. No external font/CDN is needed for the custom UI.
- Keep `/posts/*`, `/projects/`, `/about/` and `/papers/` links working.
- See `docs/CONTENT.md` for maintenance instructions.
