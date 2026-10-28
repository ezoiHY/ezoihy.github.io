# Yu Han (Harry) - Research CV

An English research CV based on [CleanCV](https://github.com/giladturok/CleanCV) by Gilad Turok (MIT). The approved editable entry point is `main.tex`; local layout overrides are in `harry-cv.sty`. The CV omits a separate skills section. Verified legacy tool and project details remain in the site's source data.

## Build and edit

Open this directory in the Codex LaTeX editor, or upload the source files to Overleaf. Select `main.tex` as the main document. The upstream example recommends LuaLaTeX. No publication records are included.

After compiling and inspecting the PDF, place the approved output at `../assets/pdf/yu-han-cv.pdf`. The site serves that download at `/assets/pdf/yu-han-cv.pdf` and renders its web CV at `/cv/` from `../_data/cv.yml`. Keep both representations aligned with `main.tex` when personal information changes.

The template is based on upstream `cleancv.sty` (Git blob SHA: cafc788b1176fb017ae28e6ce79e61f09af48617). Two small local changes normalize the package name and add a `nobibliography` option, so this CV can compile without Biber. Its license is retained in `LICENSE-CleanCV`. This CV uses A4, ET Book, CleanCV-style award lists, and dot leaders connecting entries to right-aligned dates. Project links are embedded in their titles.

## Content sources

- `../_data/profile.yml`: the homepage/About biography in `bio`, appointments in `research_experience`, contact details, education, awards, research interests, and the verified 2016-2022 informatics background.
- `../_data/cv.yml`: structured data for the web CV, synchronized with this approved LaTeX source.
- `../_projects/*.md`: project contributions, dates, and results.

- Owner-provided updates on October 27, 2026: education in 2023-2027; HKUST(GZ) research assistantship from 2026; SCUT undergraduate research in the Intelligent Structures Laboratory in 2024-2026; Huawei internship in July-September 2026; human sensing as an additional research interest; and the expanded awards below.

The header uses Yu Han (Harry). Education lists a bachelor's degree in Robotics Engineering, with graduation expected in 2027. The more specific B.Eng./B.Sc. designation is omitted because the formal award title has not been supplied.

Research Experience includes PAIRS Lab at HKUST(GZ), the SCUT laboratory supervised by Prof. Yunquan Li, and the Huawei Digital Twin Laboratory in GTS, ICT BG. The lab and internship titles are English translations of owner-provided Chinese labels. No research responsibilities or results are inferred for these appointments. The four projects remain separate and each has a concise contribution statement.

## Award wording and source notes

- National Second Prize in CUMCM (2024), Provincial First Prize in CUMCM (2025), National First Prize in APMCM (2024), H&T Cup Robotics Challenge runner-up (2024), and the Yujian Xiaomian scholarship (2024) were supplied by the owner.
- The existing profile supplies the informatics Provincial First Prize and the robotics team-captain role. The generic informatics entry has no invented competition name or year.
- [SCUT's 2024 robotics competition report](https://news.scut.edu.cn/2024/0529/c160a49150/page.htm) confirms the H&T Cup event name. [H&T's official English website](https://en.szhittech.com/) supplies the sponsor's English brand spelling. The old unspecific "400+ teams" statement is omitted; the CV lists the result and captain role only.
- [SCUT's scholarship notice](https://www2.scut.edu.cn/ee/_t1835/2024/1010/c36038a564059/page.htm) supplies the Innovation Scholarship designation. "Yujian Xiaomian" is a transliteration of the sponsor name.
- The English APMCM name follows the organizer's [2024 entry manual, hosted by SISU](https://newoaa.shisu.edu.cn/_upload/article/files/36/c4/7e46748e4857afe7f28b38b53757/fdc80a98-af27-4bd0-9f04-209196231db4.pdf). The award level and year come from the owner.

## Details to confirm before applications

- Exact informatics competition names and award years, if replacing the generic entry.
- Optional GPA/rank, official English lab/internship titles, and detailed research contributions.
- Any changes to the current status of the robotic fish project.

The informatics award remains undated because a specific award year has not been supplied. The CV does not infer publications, project leadership, quantitative performance improvements, or clinical/waterproof certification. The 2016-2022 informatics training interval is not treated as the date of a particular award.

The website's biography, appointments, research interests, education, and awards are synchronized with this approved CV. Editing the LaTeX source does not regenerate the YAML data or downloadable PDF automatically; update and verify all three together. Changes become public through the site's normal deployment workflow.
