#!/usr/bin/env python3
"""Check the published HTML, links, SVG references and client search data.

Run after ``bundle exec jekyll build``. No browser or third-party modules needed.
External links are intentionally not fetched; same-origin absolute links are
checked against the build output just like relative links.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


REQUIRED_ROUTES = (
    "/",
    "/projects/",
    "/publications/",
    "/about/",
    "/cv/",
    "/posts/",
    "/posts/hello-world/",
    "/posts/how-this-blog-works/",
    "/projects/underactuated-hand/",
    "/projects/monocular-hand-control/",
    "/projects/robotic-fish/",
    "/projects/language-quadruped/",
    "/papers/",
    "/404.html",
)
SEARCH_REQUIRED = set(REQUIRED_ROUTES[6:12])
UNRENDERED = re.compile(r"\{%\s*(?:\w|[-])[^%]*%\}|\{\{\s*[\w.'\"]+[^}]*\}\}")
EXAMPLE_IDENTITY = re.compile(r"\b(?:Albert\s+Einstein|Einstein|Your\s+Name)\b", re.I)


class Document(HTMLParser):
    def __init__(self, path: Path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids: set[str] = set()
        self.duplicate_ids: set[str] = set()
        self.links: list[tuple[str, str, int]] = []
        self.search_blocks: list[str] = []
        self._search_text: list[str] | None = None
        self.has_html = False
        self.has_main = False

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self.has_html |= tag == "html"
        self.has_main |= tag == "main"
        identifier = attributes.get("id")
        if identifier:
            if identifier in self.ids:
                self.duplicate_ids.add(identifier)
            self.ids.add(identifier)
        # Old-style HTML anchors remain legal fragment targets.
        if tag == "a" and attributes.get("name"):
            self.ids.add(attributes["name"])
        for attr in ("href", "src", "xlink:href", "poster"):
            value = attributes.get(attr)
            if value is not None:
                self.links.append((value, f"{tag}[{attr}]", self.getpos()[0]))
        srcset = attributes.get("srcset", "")
        if srcset and not srcset.lstrip().startswith("data:"):
            for candidate in srcset.split(","):
                if candidate.strip():
                    self.links.append((candidate.split()[0], f"{tag}[srcset]", self.getpos()[0]))
        if tag == "script" and identifier == "search-data":
            self._search_text = []

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data):
        if self._search_text is not None:
            self._search_text.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._search_text is not None:
            self.search_blocks.append("".join(self._search_text))
            self._search_text = None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site_dir", nargs="?", type=Path, default=Path(__file__).resolve().parents[1] / "_site")
    parser.add_argument("--origin", default="https://ezoihy.github.io", help="Public site origin for same-site absolute links")
    args = parser.parse_args()
    site = args.site_dir.resolve()
    origin = args.origin.rstrip("/")
    origin_host = urlsplit(origin).netloc
    errors: list[str] = []
    documents: dict[Path, Document] = {}
    checked_links = 0
    search_count = 0

    def fail(message: str):
        errors.append(message)

    def label(path: Path) -> str:
        return path.relative_to(site).as_posix()

    def route_file(route: str) -> Path:
        relative = unquote(urlsplit(route).path).lstrip("/")
        target = site / relative
        if not relative or relative.endswith("/") or target.is_dir():
            target /= "index.html"
        return target.resolve()

    def public_url(path: Path) -> str:
        relative = label(path)
        if relative == "index.html":
            relative = ""
        elif relative.endswith("/index.html"):
            relative = relative[:-10]
        return f"{origin}/{relative}"

    def read_document(path: Path) -> Document:
        if path not in documents:
            doc = Document(path)
            doc.feed(path.read_text(encoding="utf-8"))
            doc.close()
            documents[path] = doc
        return documents[path]

    def check_link(source: Path, value: str, context: str, line: int = 0):
        nonlocal checked_links
        location = f"{label(source)}:{line}" if line else label(source)
        value = value.strip()
        if not value or value == "#":
            return
        try:
            url = urlsplit(urljoin(public_url(source), value))
        except ValueError:
            fail(f"{location}: malformed URL in {context}: {value!r}")
            return
        if url.scheme not in ("http", "https") or url.netloc != origin_host:
            return
        checked_links += 1
        target = route_file(url.path)
        if not target.is_relative_to(site):
            fail(f"{location}: local URL escapes build directory: {value}")
            return
        if not target.is_file():
            fail(f"{location}: broken {context}: {value} → {label(target)}")
            return
        if url.fragment and target.suffix in (".html", ".svg"):
            fragment = unquote(url.fragment).split(":~:text=", 1)[0]
            if fragment and fragment not in read_document(target).ids:
                fail(f"{location}: missing fragment #{fragment} in {label(target)} ({context})")

    if not site.is_dir():
        print(f"FAIL: build directory does not exist: {site}", file=sys.stderr)
        return 1
    for route in REQUIRED_ROUTES:
        if not route_file(route).is_file():
            fail(f"required route {route} has no browser-readable HTML output ({label(route_file(route))})")
    for path in sorted(site.rglob("*.liquid")):
        fail(f"unpublished template extension in output: {label(path)}")

    html_paths = sorted(site.rglob("*.html"))
    if not html_paths:
        fail("no HTML pages generated")
    for path in html_paths:
        raw = path.read_text(encoding="utf-8")
        doc = read_document(path)
        if not doc.has_html or not doc.has_main:
            fail(f"{label(path)}: missing full page layout (<html> or <main>)")
        if UNRENDERED.search(raw):
            fail(f"{label(path)}: unresolved Liquid template syntax")
        if EXAMPLE_IDENTITY.search(raw):
            fail(f"{label(path)}: upstream example identity remains")
        for identifier in sorted(doc.duplicate_ids):
            fail(f"{label(path)}: duplicate element id {identifier!r}")
        for value, context, line in doc.links:
            check_link(path, value, context, line)
        if len(doc.search_blocks) != 1:
            fail(f"{label(path)}: expected one #search-data JSON block, got {len(doc.search_blocks)}")
            continue
        try:
            items = json.loads(doc.search_blocks[0])
        except json.JSONDecodeError as error:
            fail(f"{label(path)}: invalid search JSON: {error}")
            continue
        if not isinstance(items, list) or not items:
            fail(f"{label(path)}: search JSON must be a nonempty list")
            continue
        search_count += 1
        search_routes = set()
        for index, item in enumerate(items):
            if not isinstance(item, dict) or any(not isinstance(item.get(key), str) for key in ("title", "description", "url", "type")):
                fail(f"{label(path)}: search result {index} lacks string title/description/url/type fields")
                continue
            if not item["title"].strip() or not item["url"].strip():
                fail(f"{label(path)}: search result {index} has empty title or URL")
            if item["url"] in search_routes:
                fail(f"{label(path)}: duplicate search result URL {item['url']}")
            search_routes.add(item["url"])
            check_link(path, item["url"], f"search result {index}")
        for route in sorted(SEARCH_REQUIRED - search_routes):
            fail(f"{label(path)}: migrated content absent from search: {route}")

    if errors:
        print(f"FAIL: {len(errors)} issue(s) across {len(html_paths)} HTML pages", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print(f"PASS: {len(html_paths)} HTML pages, {len(REQUIRED_ROUTES)} required routes, {checked_links} local links and SVG fragments, {search_count} search indexes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
