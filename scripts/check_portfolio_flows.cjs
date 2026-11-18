#!/usr/bin/env node
/* Regression checks for the project comparison, research topics, and web CV.
 * Start scripts/preview.sh, then run: node scripts/check_portfolio_flows.cjs
 * Same runtime overrides as check_browser.cjs: SITE_URL, PLAYWRIGHT_MODULE,
 * AUDIT_BROWSER=chromium|webkit|firefox, BROWSER_EXECUTABLE.
 */
'use strict';
const assert = require('node:assert/strict');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = (process.env.SITE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const engine = process.env.AUDIT_BROWSER || 'chromium';
assert.ok(['chromium', 'webkit', 'firefox'].includes(engine), 'Unknown AUDIT_BROWSER');

async function compareProjects(page) {
  await page.goto(origin + '/projects/?view=list');
  const board = page.locator('#compare-projects');
  const selectors = board.locator('[data-compare-select]');
  const choices = await selectors.first().locator('option').evaluateAll(items => items.map(item => item.value));
  assert.ok(choices.length >= 2);
  await board.locator('summary').press('Enter');
  await selectors.first().waitFor();
  const pair = [await selectors.first().inputValue(), await selectors.last().inputValue()];
  assert.notEqual(pair[0], pair[1]);
  // Choosing the other column's project swaps the pair without duplicating it.
  await selectors.first().selectOption(pair[1]);
  const swapped = [pair[1], pair[0]];
  assert.deepEqual(await selectors.evaluateAll(items => items.map(item => item.value)), swapped);
  const params = new URL(page.url()).searchParams;
  assert.equal(params.get('compare'), swapped.join(','));
  assert.equal(params.get('view'), 'list');

  for (const [index, key] of swapped.entries()) {
    const record = await page.locator('[data-compare-key]').evaluateAll(
      (items, value) => ({...items.find(item => item.dataset.compareKey === value).dataset}), key
    );
    const title = board.locator('thead a').nth(index);
    assert.equal(await title.textContent(), record.shortTitle);
    for (const field of ['designChoice', 'contribution', 'evidence']) {
      assert.ok(record[field]?.trim());
      assert.equal(await board.locator('[data-compare-field="' + field + '"] td').nth(index).textContent(), record[field]);
    }
  }

  await board.locator('[data-copy-comparison]').click();
  const copyField = board.locator('.compare-share input');
  await copyField.waitFor();
  assert.equal(await copyField.inputValue(), page.url(), 'Manual copy fallback must preserve the comparison');
  const caseLink = board.locator('thead a').first();
  const destination = await caseLink.evaluate(link => link.href);
  await caseLink.click();
  await page.waitForURL(destination);
  const back = page.locator('.project-return-links [data-project-return]');
  await back.click();
  await selectors.first().waitFor();
  assert.equal(await selectors.first().inputValue(), swapped[0]);
  assert.equal(await selectors.last().inputValue(), swapped[1]);
  assert.equal(new URL(page.url()).searchParams.get('view'), 'list');

  await page.locator('[data-filter="robotics"]').click();
  const expected = { compare: swapped.join(','), view: 'list', area: 'robotics' };
  const caseLinks = page.locator('.project-card [data-project-link]');
  for (const href of await caseLinks.evaluateAll(links => links.map(link => link.href))) {
    assert.deepEqual(Object.fromEntries(new URL(href).searchParams), expected);
  }
  const caseTitle = page.locator('.project-card:visible .project-card-title a').first();
  await caseTitle.click();
  await page.locator('[data-project-continue]').first().click();
  assert.deepEqual(Object.fromEntries(new URL(page.url()).searchParams), expected);
  await back.click();
  await selectors.first().waitFor();
  assert.deepEqual(Object.fromEntries(new URL(page.url()).searchParams), expected);
  assert.deepEqual(await selectors.evaluateAll(items => items.map(item => item.value)), swapped);
  await board.locator('summary').press('Enter');
  await page.waitForFunction(() => !location.search.includes('compare='));
  const cleanLinks = await caseLinks.evaluateAll(links => links.every(link => !new URL(link.href).searchParams.has('compare')));
  assert.ok(cleanLinks, 'Closing the comparison must clear it from card and cover links');

  // An anchor on the already-loaded archive must open the native disclosure.
  await page.goto(origin + '/projects/');
  await page.locator('.header-tools .search-trigger').click();
  await page.locator('#site-search').fill('Compare projects');
  await page.locator('#search-results a[href="/projects/#compare-projects"]').click();
  await selectors.first().waitFor();
  assert.equal(await board.evaluate(el => el.open), true);
  await page.goto(origin + '/projects/?compare=unknown-project,unknown-project');
  await page.waitForFunction(() => !location.search.includes('compare='));
  assert.equal(await board.evaluate(el => el.open), false);
}

async function researchTopics(page) {
  const slug = 'dexterous-manipulation';
  const linked = 'human-sensing';
  await page.goto(origin + '/publications/#interest-' + slug, { waitUntil: 'domcontentloaded' });
  const selected = topic => page.locator('[data-map-select="' + topic + '"][aria-expanded="true"]');
  await selected(slug).waitFor();
  assert.ok(await page.locator('#context-' + slug).isVisible());
  assert.ok((await page.locator('#context-' + slug + ' p').textContent()).trim());
  const next = page.locator('[data-map-select="' + linked + '"]');
  await next.press('Space');
  await selected(linked).waitFor();
  assert.equal(new URL(page.url()).hash, '#interest-' + linked);
  assert.equal(await page.locator('.research-map-context:visible').count(), 1);
  assert.ok(await page.locator('#context-' + linked + ' a[href="/projects/monocular-hand-control/"]').isVisible());
  await page.goBack();
  await selected(slug).waitFor();
  await page.goForward();
  await selected(linked).waitFor();
  await page.locator('[data-map-hub]').press('Enter');
  assert.equal(await page.locator('.research-map-context:visible').count(), 0);
  assert.equal(new URL(page.url()).hash, '#research-interests');
}

async function curriculumVitae(page) {
  await page.goto(origin + '/cv/');
  const targets = await page.locator('.cv-outline a').evaluateAll(links => links.map(a => a.hash));
  assert.ok(targets.includes('#experience') && targets.includes('#projects'));
  for (const target of targets) assert.equal(await page.locator(target).count(), 1);
  await page.locator('.cv-outline a[href="#projects"]').press('Enter');
  assert.equal(new URL(page.url()).hash, '#projects');
  const download = page.locator('.cv-downloads a[download]');
  const pdf = await page.request.get(await download.evaluate(a => a.href));
  assert.equal(pdf.status(), 200);
  assert.equal((await pdf.body()).subarray(0, 5).toString(), '%PDF-');
  await page.locator('.print-cv').press('Enter');
  assert.equal(await page.evaluate(() => window.__portfolioPrintRequested), true);
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.cv-sidebar').isVisible(), false);
  assert.ok(await page.locator('.cv-content h1').isVisible());
}

async function noScript(page) {
  await page.goto(origin + '/projects/');
  await page.locator('.project-compare summary').click();
  const expectedCount = await page.locator('[data-compare-select]').first().locator('option').count();
  assert.ok(expectedCount >= 2);
  assert.equal(await page.locator('.comparison-record h3 a:visible').count(), expectedCount);
  assert.equal(await page.locator('.compare-controls:visible').count(), 0);
  await page.goto(origin + '/papers/');
  await page.locator('.papers-forward a').click();
  await page.waitForURL(origin + '/publications/#publications');
  const contexts = page.locator('.research-map-context');
  assert.ok(await contexts.count() > 0);
  assert.equal(await page.locator('.research-map-context:visible').count(), await contexts.count());
  await page.goto(origin + '/cv/');
  assert.equal(await page.locator('.print-cv').isVisible(), false);
  await page.locator('.cv-outline a[href="#experience"]').press('Enter');
  assert.equal(new URL(page.url()).hash, '#experience');
}

(async () => {
  const browser = await playwright[engine].launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    for (const [name, settings] of [
      ['desktop', { viewport: { width: 1280, height: 900 }}],
      ['mobile', { viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: 'dark', reducedMotion: 'reduce' }],
      ['no-JS', { viewport: { width: 320, height: 740 }, javaScriptEnabled: false }],
    ]) {
      const context = await browser.newContext(settings);
      const page = await context.newPage();
      const errors = [];
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        // Exercise denied clipboard access without writing to the host clipboard.
        Object.defineProperty(navigator, 'clipboard', {value: {writeText: () => Promise.reject(new Error('Clipboard unavailable'))}});
        window.print = () => { window.__portfolioPrintRequested = true; };
      });
      const checks = settings.javaScriptEnabled === false ? [noScript] : [compareProjects, researchTopics, curriculumVitae];
      for (const check of checks) {
        await check(page);
        assert.deepEqual(errors, [], check.name + ': uncaught page error');
        console.log('PASS ' + engine + ' ' + name + ': ' + check.name);
      }
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
