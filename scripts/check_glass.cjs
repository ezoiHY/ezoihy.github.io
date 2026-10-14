#!/usr/bin/env node
'use strict';

// Exercise the integration with a stub engine, without needing browser packages.
// Rendering/scroll smoothness still require a real Safari check.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/liquid-glass.js'), 'utf8')
  .replace("import('../vendor/gentpan-liquidglass.js')", 'loadEngine()');
const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15';
const chrome = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/145.0.0.0 Safari/537.36';

async function browser(ua, { touch = 0, failImport = false } = {}) {
  const nodes = [], observers = [], events = new Map();
  let imports = 0, measurements = 0, active = 0;
  function element() {
    const classes = new Set();
    const el = {
      dataset: {}, children: [], className: '', classList: classes,
      setAttribute() {},
      prepend(...children) { this.children.unshift(...children); },
      append(...children) { this.children.push(...children); },
      get offsetWidth() { measurements++; return 930; },
      get offsetHeight() { measurements++; return 480; },
    };
    classes.remove = value => classes.delete(value);
    nodes.push(el);
    return el;
  }
  const host = element(); host.dataset.liquidGlass = 'panel';
  const root = { dataset: { background: 'wallpaper' } };
  const register = (name, callback) => {
    assert.notEqual(name, 'scroll', 'Glass must not install scroll handlers');
    events.set(name, callback);
  };
  const document = {
    documentElement: root, hidden: false, querySelectorAll: () => [host],
    createElement: element, addEventListener: register,
  };
  const reduced = { matches: false, addEventListener: register };
  const observe = kind => class {
    constructor(callback) { this.callback = callback; this.kind = kind; observers.push(this); }
    observe() {}
  };
  const context = {
    navigator: { userAgent: ua, maxTouchPoints: touch }, document,
    window: { addEventListener: register, IntersectionObserver: true },
    matchMedia: () => reduced, getComputedStyle: () => ({ borderTopLeftRadius: '32px' }),
    MutationObserver: observe('mutation'), ResizeObserver: observe('resize'),
    IntersectionObserver: observe('intersection'),
    requestAnimationFrame() { throw Error('Integration must not run an animation loop'); },
    async loadEngine() {
      imports++;
      if (failImport) throw Error('Module unavailable');
      return { createGlass() {
        active++;
        return { update() {}, flush() {}, destroy() { active--; } };
      } };
    },
  };
  await vm.runInNewContext(source, context, { filename: 'liquid-glass.js' });
  return { root, document, reduced, host, nodes, observers, events,
    get imports() { return imports; }, get measurements() { return measurements; },
    get active() { return active; },
    refresh() { observers.find(o => o.kind === 'mutation').callback(); },
  };
}

for (const [name, ua, touch] of [
  ['Mac Safari', safari, 0],
  ['iPad desktop UA', chrome, 5],
  ['iPhone Chrome', 'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/145.0.0.0 Mobile Safari/604.1', 5],
]) {
  test(`${name}: native frost without engine requests, copies, observers, or geometry reads`, async () => {
    const b = await browser(ua, { touch });
    assert.equal(b.root.dataset.glassEngine, 'native');
    assert.equal(b.imports, 0);
    assert.equal(b.active, 0);
    assert.equal(b.measurements, 0);
    assert.equal(b.observers.length, 0);
    assert.equal(b.events.size, 0);
    assert.equal(b.nodes.some(el => /liquid-photo|liquid-optics/.test(el.className)), false);
    assert.ok(b.host.classList.has('liquid-ready'));
    assert.ok(b.nodes.some(el => el.className.includes('liquid-warp')));
    assert.ok(b.nodes.some(el => el.className.includes('liquid-rim')));
  });
}

test('optional engine failure leaves a complete native material', async () => {
  const b = await browser(chrome, { failImport: true });
  assert.equal(b.imports, 1);
  assert.equal(b.root.dataset.glassEngine, 'native');
  assert.equal(b.observers.length, 0);
  assert.equal(b.active, 0);
  assert.ok(b.host.classList.has('liquid-ready'));
});

test('enhanced renderer releases and restores lenses for preferences, visibility, and intersection', async () => {
  const b = await browser(chrome);
  assert.equal(b.root.dataset.glassEngine, 'image-refraction');
  assert.equal(b.active, 1);
  b.root.dataset.background = 'solid'; b.refresh();
  assert.equal(b.active, 0);
  assert.equal(b.host.classList.has('liquid-refracting'), false);
  b.root.dataset.background = 'wallpaper'; b.refresh();
  assert.equal(b.active, 1);
  b.document.hidden = true; b.events.get('visibilitychange')();
  assert.equal(b.active, 0);
  b.document.hidden = false; b.events.get('visibilitychange')();
  assert.equal(b.active, 1);
  b.reduced.matches = true; b.events.get('change')();
  assert.equal(b.active, 0);
  b.reduced.matches = false; b.events.get('change')();
  assert.equal(b.active, 1);
  const intersection = b.observers.find(o => o.kind === 'intersection');
  intersection.callback([{ target: b.host, isIntersecting: false }]);
  assert.equal(b.active, 0);
  intersection.callback([{ target: b.host, isIntersecting: true }]);
  assert.equal(b.active, 1);
  assert.equal(b.imports, 1);
});
