#!/usr/bin/env node
/* Browser checks for a locally served build. Requires Playwright + Chromium.
 * SITE_URL=http://127.0.0.1:4000 node scripts/check_browser.cjs
 * Optional: PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE, AUDIT_OUTPUT,
 * AUDIT_BROWSER=chromium|webkit|firefox (default chromium),
 * AUDIT_CHECKS=search,nojs,routes (omit for the complete interaction matrix).
 * Every run captures desktop/mobile light/dark screenshots and cold-load metrics.
 * Metrics are laboratory observations, not production Core Web Vitals.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browserName = process.env.AUDIT_BROWSER || 'chromium';
assert.ok(['chromium', 'webkit', 'firefox'].includes(browserName), 'Unknown AUDIT_BROWSER');
const origin = (process.env.SITE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const output = path.resolve(process.env.AUDIT_OUTPUT || 'test-results/browser');
const selected = process.env.AUDIT_CHECKS ? new Set(process.env.AUDIT_CHECKS.split(',')) : null;
const enabled = name => !selected || selected.has(name);
const report = { origin, browser: browserName, capturedAt: new Date().toISOString(), metrics: [], checks: [], issues: [] };
const modes = [
  ['desktop-light', { width: 1440, height: 1000 }, 'light'],
  ['desktop-dark', { width: 1440, height: 1000 }, 'dark'],
  ['mobile-light', { width: 390, height: 844 }, 'light'],
  ['mobile-dark', { width: 390, height: 844 }, 'dark'],
];
fs.mkdirSync(output, { recursive: true });
let currentPage;
function save() {
  fs.writeFileSync(path.join(output, 'audit.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(output, 'metrics.jsonl'), report.metrics.map(x => JSON.stringify(x)).join('\n') + '\n');
}
async function check(name, fn) {
  try {
    report.checks.push({ name, pass: true, value: await fn() });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, pass: false, error: error.message });
    report.issues.push({ name, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
  // Keep one failed dialog assertion from contaminating unrelated checks.
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())).catch(() => {});
  }
  save();
}
async function escapeSearch(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#search-dialog').open);
}
async function search(page) {
  await page.locator('.search-trigger').click();
  assert.equal(await page.locator('.search-result').count(), await page.locator('.desktop-nav a').count());
  await page.locator('[data-search-type="Post"]').click();
  await page.locator('#site-search').fill('zzzz-no-such-post');
  await page.locator('.search-empty button').click();
  assert.equal(await page.locator('[data-search-type="all"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-search-type="Research"]').click();
  await page.locator('#site-search').fill('dexterous');
  assert.ok(await page.locator('.search-result[href$="#interest-dexterous-manipulation"]').isVisible());
  await page.locator('[data-search-type="Project"]').click();
  await page.locator('#site-search').fill('hand');
  assert.ok(await page.locator('.search-result').count());
  await page.locator('#site-search').press('ArrowDown');
  assert.ok(await page.locator('.search-result').first().evaluate(el => el === document.activeElement));
  await page.locator('#site-search').fill('zzzz-no-such-project');
  assert.match(await page.locator('#search-results').innerText(), /No results/);
  await escapeSearch(page);
  await page.keyboard.press('Control+k');
  await page.waitForFunction(() => document.querySelector('#search-dialog').open);
  await escapeSearch(page);
}
async function homePortrait(page) {
  const hero = page.locator('.profile-section');
  const portrait = hero.locator('.profile-portrait img');
  assert.equal(await portrait.count(), 1);
  await portrait.evaluate(img => img.decode());
  const identity = await portrait.evaluate(img => ({
    file: new URL(img.currentSrc).pathname.split('/').pop(),
    alt: img.alt,
    link: img.closest('a')?.pathname,
  }));
  assert.match(identity.file, /^portrait(?:-\d+)?\.webp$/);
  assert.match(identity.alt, /Yu Han/i);
  assert.equal(identity.link, '/about/');
  const portraitCount = await hero.locator('img').evaluateAll(images =>
    images.filter(img => /\/portrait(?:-\d+)?\.webp$/.test(new URL(img.currentSrc || img.src).pathname)).length);
  assert.equal(portraitCount, 1, 'The hero contains a single portrait');

  const photograph = await portrait.boundingBox();
  const name = await hero.locator('h1').evaluate(heading => {
    const range = document.createRange();
    range.selectNodeContents(heading);
    const {right, top, bottom} = range.getBoundingClientRect();
    return {right, top, bottom};
  });
  assert.ok(photograph && photograph.width > 0 && photograph.height > 0);
  assert.ok(photograph.x >= name.right - 1, 'Portrait must sit to the right of the name');
  assert.ok(photograph.y < name.bottom && photograph.y + photograph.height > name.top,
    'Portrait and name must share a row');

  await portrait.click();
  await page.waitForURL(origin + '/about/');
  await page.goBack();
  await page.waitForURL(origin + '/');
}
async function homePreview(page) {
  const rows = page.locator('.selected-project:has([data-quick-trigger])');
  const titles = await rows.locator('.selected-project-title').allTextContents();
  const trigger = rows.first().locator('[data-quick-trigger]');
  await trigger.click();
  const dialog = page.locator('#quick-look[open]');
  const title = dialog.locator('h2');
  assert.equal(await title.textContent(), titles[0]);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await title.textContent(), titles.at(-1));
  await dialog.locator('[data-quick-next]').click();
  assert.equal(await title.textContent(), titles[0]);
  assert.equal(await dialog.locator('.quick-project-link').getAttribute('href'),
    await rows.first().locator('.selected-project-title a').getAttribute('href'));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.activeElement.matches('[data-quick-trigger]'));
  const software = page.locator('.home-jumps a[href="#software-title"]');
  await software.click();
  await page.waitForFunction(() => document.querySelector('.home-jumps [aria-current]')?.hash === '#software-title');
  await page.evaluate(() => window.scrollTo(0, 0));
}
function readWallpaperFrame() {
  const scene = document.querySelector('.wallpaper-scene');
  const reflections = document.querySelector('.main-shell .coastal-reflections');
  const frame = (element, pseudo) => {
    const style = getComputedStyle(element, pseudo);
    return [style.transform, style.opacity, style.backgroundPosition];
  };
  return {
    scenery: frame(scene),
    sceneryLight: frame(scene, '::after'),
    reflectedLight: frame(reflections, '::before'),
    reflectedRipple: frame(reflections, '::after'),
  };
}
function readReflectionCanvas() {
  const canvas = document.querySelector('.main-shell .coastal-reflections');
  const paper = document.querySelector('.main-shell :is(.home-page, .document-panel)');
  const rect = canvas.getBoundingClientRect();
  const paints = pseudo => {
    const style = getComputedStyle(canvas, pseudo);
    return style.display !== 'none' && style.content !== 'none' && style.content !== 'normal' &&
      style.backgroundImage !== 'none' && style.animationName !== 'none';
  };
  return {
    canvasWidth: rect.width,
    canvasHeight: rect.height,
    paperWidth: paper.getBoundingClientRect().width,
    visibleBands: rect.height > 0 && rect.width > 0 && paints('::before') && paints('::after'),
    decorative: Boolean(canvas.closest('[aria-hidden="true"]')),
    pointerEvents: getComputedStyle(canvas).pointerEvents,
    viewport: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  };
}
async function checkScrolledReflections(page) {
  // Sample a long document after its first screen, then when its footer appears.
  const canvas = page.locator('.main-shell .coastal-reflections');
  const bounds = () => canvas.evaluate(element => {
    const field = element.closest('.coastal-field').getBoundingClientRect();
    const tile = element.getBoundingClientRect();
    return { fieldTop: field.top, fieldBottom: field.bottom, top: tile.top, bottom: tile.bottom, height: innerHeight };
  });
  await canvas.evaluate(element => {
    const field = element.closest('.coastal-field').getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + field.top + (field.height - innerHeight) / 2, behavior: 'instant' });
  });
  const middle = await bounds();
  assert.ok(middle.fieldTop < 0 && middle.fieldBottom > middle.height, 'Reflections must cover the long document');
  assert.ok(middle.top < middle.height / 2 && middle.bottom > middle.height / 2, 'Reflections must follow the reader');
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  const end = await bounds();
  assert.ok(end.fieldBottom <= end.height && end.bottom <= end.fieldBottom + 1, 'Reflections must stop before the footer');
}
async function sampleWallpaper(page, moving, label) {
  // CSS pauses take effect on the next rendering update in WebKit and Blink.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const before = await page.evaluate(readWallpaperFrame);
  // Real elapsed time samples both composited transforms and animated light.
  await page.waitForTimeout(moving ? 1100 : 450);
  const after = await page.evaluate(readWallpaperFrame);
  for (const layer of Object.keys(before)) {
    if (moving) assert.notDeepEqual(after[layer], before[layer], `${label}: ${layer} must move`);
    else assert.deepEqual(after[layer], before[layer], `${label}: ${layer} must stay still`);
  }
  return { before, after };
}
async function wallpaperMotion(page) {
  const root = page.locator('html');
  const toggle = page.locator('#wallpaper-motion');
  const openSettings = () => page.locator('.background-toggle').click();
  const closeSettings = async () => {
    await page.locator('.wallpaper-close').click();
    await page.locator('#wallpaper-dialog').waitFor({ state: 'hidden' });
  };
  const contentBoxes = () => page.locator('.profile-portrait img, #profile-name, .biography p').evaluateAll(elements =>
    elements.map(element => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    }));

  assert.equal(await root.getAttribute('data-wallpaper-motion'), 'on');
  assert.equal(await page.locator('.main-shell .coastal-reflections').count(), 1);
  const boxes = await contentBoxes();
  assert.equal(boxes.length, 3);
  const movement = await sampleWallpaper(page, true, 'Default wallpaper');
  assert.deepEqual(await contentBoxes(), boxes, 'Portrait, name, and biography must stay in place');

  await openSettings();
  assert.ok(await toggle.isChecked());
  await toggle.uncheck();
  await closeSettings();
  assert.equal(await root.getAttribute('data-wallpaper-motion'), 'off');
  await sampleWallpaper(page, false, 'Motion switched off');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await root.getAttribute('data-wallpaper-motion'), 'off');
  await page.locator('.profile-portrait').click();
  await page.waitForURL(origin + '/about/');
  await sampleWallpaper(page, false, 'Saved preference on About');
  await openSettings();
  assert.equal(await toggle.isChecked(), false);
  await toggle.check();
  await closeSettings();
  await sampleWallpaper(page, true, 'Motion switched on from About');
  await page.goto(origin, { waitUntil: 'networkidle' });
  assert.equal(await root.getAttribute('data-wallpaper-motion'), 'on');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  await sampleWallpaper(page, false, 'Reduced motion');
  await page.emulateMedia({ reducedMotion: 'no-preference', contrast: 'more' });
  assert.ok(await page.evaluate(() => matchMedia('(prefers-contrast: more)').matches));
  await sampleWallpaper(page, false, 'High contrast');
  await page.emulateMedia({ contrast: 'no-preference' });
  await openSettings();
  await page.locator('#wallpaper-enabled').uncheck();
  await closeSettings();
  assert.equal(await root.getAttribute('data-background'), 'solid');
  await sampleWallpaper(page, false, 'Solid background');
  await openSettings();
  await page.locator('#wallpaper-enabled').check();
  await closeSettings();

  // Headless browsers keep all tabs visible. Exercise the same event and
  // hidden flag that the browser uses, then restore its native getter.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  try {
    assert.equal(await root.getAttribute('data-page-visible'), 'false');
    await sampleWallpaper(page, false, 'Hidden-page event');
  } finally {
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
  }
  await sampleWallpaper(page, true, 'Visible page resumed');
  return movement;
}
async function wallpaper(page, name) {
  await page.locator('.background-toggle').click();
  await page.locator('#wallpaper-enabled').uncheck();
  await page.locator('.wallpaper-close').click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-background'), 'solid');
  assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.includes('/big-sur/')).length), 0);
  await page.locator('.background-toggle').click();
  await page.locator('#wallpaper-enabled').check();
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--wallpaper-a-image').includes('.webp'));
  const scenes = [];
  for (const [time, period] of [['06:00', 'sunrise'], ['12:00', 'day'], ['18:00', 'sunset'], ['22:00', 'night']]) {
    await page.locator(`[data-wallpaper-preset="${time}"]`).click();
    await page.waitForFunction(p => document.documentElement.dataset.wallpaperPeriod === p, period);
    await page.waitForTimeout(700); // The wallpaper's CSS crossfade is 600 ms.
    await page.locator('.wallpaper-close').click();
    await page.screenshot({ path: path.join(output, `${name}-wallpaper-${period}.png`) });
    scenes.push(await page.evaluate(() => ({
      period: document.documentElement.dataset.wallpaperPeriod,
      color: getComputedStyle(document.querySelector('.biography')).color,
      panel: getComputedStyle(document.querySelector('.profile-section')).backgroundColor,
    })));
    await page.locator('.background-toggle').click();
  }
  await page.locator('.wallpaper-close').click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-background'), 'wallpaper');
  assert.equal(await page.locator('html').getAttribute('data-wallpaper-time'), '22:00');
  const photos = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(r => r.name.includes('/big-sur/')).map(r => new URL(r.name).pathname));
  assert.equal(photos.length, 1);
  assert.match(photos[0], new RegExp(name.startsWith('mobile') ? '-960.webp$' : '-1600.webp$'));
  await page.locator('.background-toggle').click();
  await page.locator('#wallpaper-enabled').uncheck();
  await page.keyboard.press('Escape');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(r => r.name.includes('/big-sur/')).length), 0);
  return { scenes, photos };
}
async function projects(page) {
  const requests = [];
  page.on('request', req => { if (req.url().includes('.mp4')) requests.push(req.url()); });
  await page.goto(origin + '/projects/', { waitUntil: 'networkidle' });
  const categories = await page.locator('[data-filter]').evaluateAll(es => es.map(e => e.dataset.filter));
  for (const category of categories) {
    await page.locator(`[data-filter="${category}"]`).click();
    const cards = await page.locator('[data-project-area]').evaluateAll(es => es.map(e => ({ hidden: e.hidden, area: e.dataset.projectArea })));
    for (const card of cards) assert.equal(card.hidden, category !== 'all' && card.area !== category);
  }
  await page.locator('[data-filter="all"]').click();
  const host = page.locator('[data-project-motion]').first();
  await host.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  assert.equal(requests.length, 0, 'Browsing must not download a video');
  assert.equal(await host.locator('video').evaluate(v => v.paused), true);
  await host.locator('button').click();
  await page.waitForFunction(() => {
    const video = document.querySelector('[data-project-motion] video');
    return !video.paused && video.currentTime > 0;
  });
  assert.ok(requests.length > 0);
  await host.locator('button').click();
  assert.equal(await host.locator('video').evaluate(v => v.paused), true);
  return { categories, manualVideoRequests: requests.length };
}
(async () => {
  const browser = await playwright[browserName].launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  });
  try {
    for (const [name, viewport, scheme] of modes) {
      const context = await browser.newContext({ viewport, colorScheme: scheme, deviceScaleFactor: 1, timezoneId: 'Asia/Shanghai' });
      const page = await context.newPage();
      currentPage = page;
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__metrics = { lcp: null, cls: 0, longTasks: [] };
        new PerformanceObserver(list => {
          for (const e of list.getEntries()) window.__metrics.lcp = { start: e.startTime, size: e.size, element: e.element?.className, url: e.url };
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__metrics.cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => {
          for (const e of list.getEntries()) window.__metrics.longTasks.push(e.duration);
        }).observe({ type: 'longtask', buffered: true });
      });
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      // Collect before full-page capture, which can activate lazy image loading.
      const data = await page.evaluate(() => ({
        metrics: window.__metrics,
        requests: performance.getEntriesByType('resource').map(r => ({
          name: r.name.startsWith('http') ? new URL(r.name).pathname : r.name.slice(0, 40),
          bytes: r.transferSize, decoded: r.decodedBodySize, duration: r.duration,
        })),
        canvases: [...document.querySelectorAll('canvas')].map(c => ({ w: c.width, h: c.height })),
        dom: document.querySelectorAll('*').length,
        background: document.documentElement.dataset.background,
        theme: document.documentElement.dataset.theme,
        viewport: [innerWidth, innerHeight], scrollWidth: document.documentElement.scrollWidth,
      }));
      report.metrics.push({ name, errors: [...errors], ...data });
      await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
      await check(`${name}: clean default`, async () => {
        assert.equal(errors.length, 0);
        assert.equal(data.background, 'wallpaper');
        assert.equal(data.theme, scheme);
        assert.equal(data.canvases.length, 0);
        assert.equal(data.scrollWidth, viewport.width);
        assert.equal(data.requests.filter(r => /liquid-glass|glass-controls|\.mp4$/.test(r.name)).length, 0);
        const photos = data.requests.filter(r => r.name.includes('/big-sur/'));
        assert.equal(photos.length, 1, 'Only the current wallpaper scene loads');
        assert.match(photos[0].name, new RegExp(name.startsWith('mobile') ? '-960.webp$' : '-1600.webp$'));
        return { bytes: data.requests.reduce((n, r) => n + r.bytes, 0), requests: data.requests.length, dom: data.dom };
      });
      await page.evaluate(() => scrollTo(0, 0));
      if (enabled('search')) await check(`${name}: search keyboard and empty state`, () => search(page));
      if (enabled('portrait')) await check(`${name}: right-hand portrait and About link`, () => homePortrait(page));
      if (enabled('quicklook')) await check(`${name}: project quick look and section navigation`, () => homePreview(page));
      if (enabled('theme')) await check(`${name}: theme toggle and persistence`, async () => {
        await page.locator('.theme-toggle').click();
        const next = scheme === 'light' ? 'dark' : 'light';
        assert.equal(await page.locator('html').getAttribute('data-theme'), next);
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('html').getAttribute('data-theme'), next);
        await page.locator('.theme-toggle').click();
      });
      if (enabled('menu') && name.startsWith('mobile')) await check(`${name}: mobile menu`, async () => {
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
        await page.locator('.menu-toggle').click();
        await page.locator('#mobile-nav a[href="/projects/"]').click();
        await page.waitForURL('**/projects/');
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
        await page.goto(origin, { waitUntil: 'networkidle' });
      });
      if (enabled('wallpaper-motion')) await check(`${name}: wallpaper motion and preferences`, () => wallpaperMotion(page));
      if (enabled('wallpaper')) await check(`${name}: wallpaper scenes and persistence`, () => wallpaper(page, name));
      if (enabled('projects')) await check(`${name}: project filtering and manual video`, () => projects(page));
      await check(`${name}: no runtime errors`, async () => assert.deepEqual(errors, []));
      await context.close();
    }
    if (enabled('motion')) await check('reduced motion: no animation or unsolicited video', async () => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      try {
        await page.goto(origin + '/projects/', { waitUntil: 'networkidle' });
        await page.locator('[data-project-motion]').scrollIntoViewIfNeeded();
        assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.includes('.mp4')).length), 0);
        assert.equal(await page.locator('.wallpaper-layer').first().evaluate(e => getComputedStyle(e).transitionDuration), '0s');
        await sampleWallpaper(page, false, 'Reduced motion on Projects');
        assert.equal(await page.locator('canvas').count(), 0);
      } finally { await context.close(); }
    });
    if (enabled('accessibility')) await check('dark wallpaper: print and reduced transparency', async () => {
      const context = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      try {
        await page.goto(origin, { waitUntil: 'networkidle' });
        await page.emulateMedia({ media: 'print' });
        const print = await page.evaluate(() => ({
          panel: getComputedStyle(document.querySelector('.profile-section')).backgroundColor,
          color: getComputedStyle(document.querySelector('.biography')).color,
          wallpaper: getComputedStyle(document.querySelector('.desktop-wallpaper')).display,
          reflectionsVisible: document.querySelector('.coastal-reflections').getClientRects().length > 0,
        }));
        assert.equal(print.panel, 'rgb(255, 255, 255)');
        assert.equal(print.color, 'rgb(17, 17, 17)');
        assert.equal(print.wallpaper, 'none');
        assert.equal(print.reflectionsVisible, false);
        await page.screenshot({ path: path.join(output, 'dark-print.png') });
        await page.emulateMedia({ media: 'screen', contrast: 'more' });
        const opaqueMaterial = () => ({
          panel: getComputedStyle(document.querySelector('.profile-section')).backgroundColor,
          blur: getComputedStyle(document.querySelector('.header-wrap')).backdropFilter,
        });
        const contrast = await page.evaluate(opaqueMaterial);
        assert.match(contrast.panel, /^rgb\(/);
        assert.equal(contrast.blur, 'none');
        let transparency = 'CDP media emulation is available only in Chromium; contrast fallback verified';
        if (browserName === 'chromium') {
          const cdp = await context.newCDPSession(page);
          await cdp.send('Emulation.setEmulatedMedia', { media: 'screen', features: [
            { name: 'prefers-color-scheme', value: 'dark' },
            { name: 'prefers-reduced-transparency', value: 'reduce' },
          ] });
          assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches));
          transparency = await page.evaluate(opaqueMaterial);
          assert.match(transparency.panel, /^rgb\(/);
          assert.equal(transparency.blur, 'none');
          await page.screenshot({ path: path.join(output, 'dark-reduced-transparency.png') });
        }
        return { print, contrast, transparency };
      } finally { await context.close(); }
    });
    if (enabled('nojs')) await check('no JavaScript: content and mobile navigation', async () => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      try {
        await page.goto(origin, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('.selected-project:visible').count(), 6);
        const projectsLink = page.locator('.desktop-nav a[href="/projects/"]');
        assert.equal(await projectsLink.isVisible(), true);
        await projectsLink.click();
        await page.waitForURL('**/projects/');
        assert.equal(await page.locator('[data-category]:visible').count(), 6);
        await page.screenshot({ path: path.join(output, 'no-js.png'), fullPage: true });
      } finally { await context.close(); }
    });
    if (enabled('layout')) await check('reflection canvas adapts from phone to widescreen', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const result = {};
      try {
        for (const route of ['/', '/projects/', '/posts/hello-world/']) {
          const widths = [390, 768, 1024, 1440, 1920];
          await page.goto(origin + route, { waitUntil: 'networkidle' });
          const sizes = [];
          for (const width of widths) {
            await page.setViewportSize({ width, height: 900 });
            const size = await page.evaluate(readReflectionCanvas);
            assert.ok(size.visibleBands, `${route} at ${width}px: missing reflections`);
            assert.ok(size.decorative);
            assert.equal(size.pointerEvents, 'none');
            assert.ok(size.scrollWidth <= size.viewport, `${route} at ${width}px: horizontal overflow`);
            assert.ok(size.paperWidth > 0 && size.paperWidth <= size.viewport);
            sizes.push(size);
            if (route === '/projects/' && (width === 390 || width === 1440)) await checkScrolledReflections(page);
          }
          assert.ok(sizes[1].canvasWidth > sizes[0].canvasWidth, `${route}: canvas must grow from phone to tablet`);
          assert.ok(sizes[3].canvasWidth > sizes[1].canvasWidth, `${route}: canvas must adapt to desktop`);
          assert.ok(sizes[4].canvasWidth >= sizes[3].canvasWidth, `${route}: canvas must accommodate wider screens`);
          if (route === '/projects/') {
            assert.ok(sizes[0].canvasHeight < sizes[3].canvasHeight, 'Long pages must use a shorter reflection area on phones');
          }
          result[route] = sizes;
        }
      } finally { await context.close(); }
      return result;
    });
    if (enabled('routes')) await check('320px: routes and horizontal overflow', async () => {
      const context = await browser.newContext({ viewport: { width: 320, height: 740 } });
      const page = await context.newPage();
      const result = [];
      try {
        const routes = ['/', '/projects/', '/about/', '/papers/', '/publications/', '/cv/', '/posts/',
          '/posts/hello-world/', '/posts/how-this-blog-works/', '/projects/underactuated-hand/',
          '/projects/monocular-hand-control/', '/projects/robotic-fish/', '/projects/language-quadruped/',
          '/projects/hyadex/', '/projects/papernas/', '/404.html'];
        for (const route of routes) {
          const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
          const info = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, h1: document.querySelector('h1')?.textContent.trim(), url: location.pathname }));
          result.push({ route, status: response.status(), ...info });
          assert.equal(response.status(), 200, route);
          assert.ok(info.scrollWidth <= info.width, `${route}: horizontal overflow ${info.scrollWidth}/${info.width}`);
          const canvas = await page.evaluate(readReflectionCanvas);
          assert.ok(canvas.visibleBands, `${route}: both reflection bands must render at 320px`);
          assert.ok(canvas.decorative, `${route}: reflections must be hidden from assistive technology`);
          assert.equal(canvas.pointerEvents, 'none');
        }
        await page.goto(origin, { waitUntil: 'networkidle' });
        await page.screenshot({ path: path.join(output, 'mobile-320.png'), fullPage: true });
      } finally { await context.close(); }
      return result;
    });
  } finally {
    await browser.close();
    save();
  }
  console.log(`${report.checks.length - report.issues.length}/${report.checks.length} checks passed; artifacts: ${output}`);
  process.exitCode = report.issues.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
