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
        }));
        assert.equal(print.panel, 'rgb(255, 255, 255)');
        assert.equal(print.color, 'rgb(17, 17, 17)');
        assert.equal(print.wallpaper, 'none');
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
