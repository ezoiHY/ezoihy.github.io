#!/usr/bin/env node
'use strict';

// Integration/lifecycle checks with a stub renderer. This does not measure
// shader pixels, browser frame rate, or real Safari scrolling performance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/liquid-glass.js'), 'utf8')
  .replace(/^import\s*\{\s*engine\s*\}\s*from\s*['"][^'"]+['"];\s*$/m, '')
  .replace("import('./glass-wallpaper.js')", 'loadEngine()');

async function browser({ failImport = false, failGPU = false, panelCount = 1, webkit = false } = {}) {
  const nodes = [], observers = [], frames = new Map(), timers = new Map(), draws = [], factories = [];
  let imports = 0, active = 0, serial = 0, top = 110, canvasTop = 0, canvasLeft = 0, clock = 0, sourceCopies = 0, imagesCreated = 0;
  const eventTarget = () => ({
    events: new Map(),
    addEventListener(name, callback, options) {
      this.events.set(name, callback);
      if (name === 'scroll') assert.equal(options.passive, true);
    },
    fire(name, event = {}) { this.events.get(name)?.(event); },
  });
  function element(tag = 'span') {
    const classes = new Set();
    classes.remove = value => classes.delete(value);
    const el = Object.assign(eventTarget(), {
      tagName: tag.toUpperCase(), dataset: {}, children: [], className: '', classList: classes, style: {},
      clientWidth: 1000, clientHeight: 800, opacity: '1', animations: [],
      backgroundImage: 'url("http://site.test/assets/img/big-sur/big-sur-4.jpg")',
      setAttribute() {}, remove() { this.removed = true; },
      prepend(...children) { children.forEach(child => { child.parentElement = this; }); this.children.unshift(...children); },
      append(...children) { children.forEach(child => { child.parentElement = this; }); this.children.push(...children); },
      getBoundingClientRect() {
        return { left: 35, top: this.rectTop ?? top, width: 930, height: 480 };
      },
      getAnimations() { return this.animations; },
      getContext(type) {
        assert.equal(type, '2d', 'Only optional source downsampling may request a 2D context');
        return { drawImage() { sourceCopies++; } };
      },
    });
    nodes.push(el);
    return el;
  }
  const hosts = Array.from({ length: panelCount }, () => { const el = element(); el.dataset.liquidGlass = 'panel'; return el; });
  const host = hosts[0];
  const wallpaper = element(), a = element(), b = element();
  wallpaper.getBoundingClientRect = () => ({ left: canvasLeft, top: canvasTop, width: 1000, height: 800 });
  b.backgroundImage = 'none'; b.opacity = '0';
  wallpaper.querySelector = selector => selector === '.wallpaper-a' ? a : b;
  const root = { dataset: { background: 'wallpaper' } };
  const document = Object.assign(eventTarget(), {
    documentElement: root, scrollingElement: { scrollHeight: 3000 }, hidden: false, querySelectorAll: () => hosts,
    querySelector: () => wallpaper, createElement: element,
  });
  const window = Object.assign(eventTarget(), {
    IntersectionObserver: true, scrollY: 0, innerHeight: 800,
    visualViewport: eventTarget(),
  });
  const reduced = Object.assign(eventTarget(), { matches: false });
  const contrast = Object.assign(eventTarget(), { matches: false });
  const observe = kind => class {
    constructor(callback) { this.callback = callback; this.kind = kind; observers.push(this); }
    observe() {}
  };
  const context = {
    engine: webkit ? 'webkit' : 'blink',
    performance: { now: () => clock },
    document, window, location: new URL('http://site.test/'), URL,
    matchMedia: query => query.includes('transparency') ? reduced : contrast,
    getComputedStyle: node => ({ ...node, borderTopLeftRadius: '32px' }),
    MutationObserver: observe('mutation'), ResizeObserver: observe('resize'),
    IntersectionObserver: observe('intersection'),
    Image: class {
      naturalWidth = 128;
      naturalHeight = 80;
      constructor() { imagesCreated++; }
      async decode() {}
    },
    requestAnimationFrame(callback) { const id = ++serial; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(callback) { const id = ++serial; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    async loadEngine() {
      imports++;
      if (failImport) throw Error('Module unavailable');
      return { createWallpaperLens(canvas) {
        factories.push(canvas);
        if (failGPU) throw Error('GPU unavailable');
        active++;
        let destroyed = false;
        return {
          render(images, lens, opacity, scene) {
            assert.equal(destroyed, false, 'Destroyed GPU renderers cannot draw');
            assert.ok(lens && !Array.isArray(lens), 'Each direct renderer receives one card-local lens');
            draws.push({ canvas, images, lens: { ...lens }, opacity: [...opacity], scene: { ...scene } });
          },
          destroy() {
            assert.equal(destroyed, false, 'Release each GPU renderer exactly once');
            destroyed = true;
            active--;
          },
        };
      } };
    },
  };
  await vm.runInNewContext(source, context, { filename: 'liquid-glass.js' });
  const tick = () => new Promise(setImmediate);
  await tick();
  return { root, document, window, host, hosts, wallpaper, nodes, observers, reduced, contrast, a, b, draws, factories,
    get active() { return active; }, get pending() { return frames.size; },
    get imports() { return imports; },
    get canvas() { return nodes.find(node => node.className.includes('liquid-surface-canvas')); },
    get sourceCopies() { return sourceCopies; },
    get imagesCreated() { return imagesCreated; },
    set top(value) { top = value; },
    advance(ms) { clock += ms; },
    set canvasTop(value) { canvasTop = value; },
    set canvasLeft(value) { canvasLeft = value; },
    setHostTop(index, value) { hosts[index].rectTop = value; },
    get timers() { return timers.size; },
    settle() { const pending = [...timers.values()]; timers.clear(); pending.forEach(callback => callback()); },
    async refresh() { observers.find(observer => observer.kind === 'mutation').callback(); await tick(); },
    paint() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
  };
}

test('optional module failure preserves CSS material without panel copies', async () => {
  const b = await browser({ failImport: true });
  assert.equal(b.root.dataset.glassEngine, 'native');
  assert.equal(b.pending, 0);
  assert.equal(b.active, 0);
  assert.ok(b.host.classList.has('liquid-ready'));
  assert.ok(b.nodes.some(node => node.className.includes('liquid-shade')));
  assert.equal(b.nodes.some(node => /liquid-photo|liquid-optics/.test(node.className)), false);
});

test('WebKit keeps one native material through fast scrolling without a wallpaper sampling pipeline', async () => {
  const b = await browser({ webkit: true, panelCount: 3 });
  assert.equal(b.root.dataset.glassEngine, 'native');
  for (const host of b.hosts) {
    assert.ok(host.classList.has('liquid-ready'));
    for (const material of ['liquid-warp', 'liquid-shade', 'liquid-rim']) {
      assert.ok(host.children.some(node => node.className.includes(material)),
        `${material} remains attached to its card`);
    }
    const optics = host.children.find(node => node.className.includes('liquid-native-optics'));
    assert.ok(optics, 'The native optical clips belong to the same card');
    assert.equal(optics.parentElement, host);
    assert.equal(optics.children.length, 4);
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const edge = optics.children.find(node => node.className.includes(`liquid-native-${side}`));
      assert.ok(edge, `The ${side} edge has its own native clip`);
      assert.equal(edge.parentElement, optics);
      assert.equal(edge.children.length, 2, 'Both wallpaper crossfade layers share the clip');
      for (const photo of ['a', 'b']) {
        const source = edge.children.find(node => node.className.includes(`wallpaper-${photo}`));
        assert.ok(source?.className.includes('liquid-native-source'));
        assert.equal(source.parentElement, edge);
      }
    }
    assert.ok(host.children.indexOf(optics) < host.children.findIndex(node => node.className.includes('liquid-warp')),
      'The common frost and tint are painted above the native optical copies');
  }
  assert.equal(b.imports, 0, 'WebKit does not load the optional photo renderer');
  assert.equal(b.imagesCreated, 0, 'Native material does not decode copied wallpaper photographs');
  assert.equal(b.nodes.filter(node => node.tagName === 'CANVAS').length, 0);
  assert.equal(b.active, 0);
  assert.equal(b.pending, 0);
  assert.equal(b.timers, 0);
  for (const event of ['scroll', 'wheel', 'touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    assert.equal(b.window.events.has(event), false, `No ${event} sampling listener is attached`);
  }
  assert.equal(b.window.visualViewport.events.has('scroll'), false);
  assert.equal(b.window.visualViewport.events.has('resize'), false);
  for (let i = 0; i < 100; i++) {
    b.window.scrollY = i % 2 ? 2100 : -40;
    b.top = 110 - b.window.scrollY;
    b.window.fire('wheel', { deltaY: i % 2 ? 200 : -200 });
    b.window.fire('scroll');
    b.window.visualViewport.fire('scroll');
  }
  b.paint();
  assert.equal(b.root.dataset.glassEngine, 'native', 'Rapid reversals never switch the native material');
  assert.equal(b.draws.length, 0);
  assert.equal(b.active, 0);
  assert.equal(b.pending, 0);
  assert.equal(b.timers, 0);
  assert.equal(b.imports, 0);
  assert.equal(b.imagesCreated, 0);
});

test('direct GPU drawing has no idle frame loop and scroll samples are committed in the event', async () => {
  const b = await browser();
  b.paint();
  assert.equal(b.active, 1);
  assert.equal(b.pending, 0);
  assert.equal(b.root.dataset.glassEngine, 'wallpaper-lens');
  assert.equal(b.nodes.filter(node => node.className.includes('liquid-surface-canvas')).length, 1);
  b.top = 40;
  const before = b.draws.length;
  b.window.fire('scroll');
  assert.equal(b.draws.length, before + 1, 'Scroll draws without waiting for the next requested frame');
  assert.equal(b.draws.at(-1).lens.y, 40);
  assert.equal(b.pending, 0);
  assert.equal(b.active, 1);
  assert.equal(b.sourceCopies, 0, 'Ordinary scrolling never copies GPU output through a 2D canvas');
});

test('each optical silhouette draws directly in its own card canvas', async () => {
  const b = await browser({ panelCount: 3 }); b.paint();
  assert.equal(b.active, 3);
  assert.equal(b.draws.length, 3);
  for (const host of b.hosts) {
    const surface = host.children.find(node => node.className.includes('liquid-surface-canvas'));
    assert.ok(surface, 'Optical bitmap is a child of the same card as the content and frost');
    assert.equal(surface.parentElement, host);
    assert.ok(b.factories.includes(surface), 'The actual card canvas is passed to the WebGL renderer');
    assert.equal(b.draws.find(draw => draw.lens.id === host).canvas, surface);
  }
  assert.equal(b.wallpaper.children.some(node => node.tagName === 'CANVAS'), false,
    'No independently moving silhouette may be mounted on the fixed wallpaper');
  assert.ok(b.factories.every(canvas => b.hosts.includes(canvas.parentElement)),
    'There is no intermediate off-DOM GPU canvas');
  assert.ok(b.draws.every(draw => draw.images[0] === b.draws[0].images[0]),
    'Card renderers share the decoded wallpaper source');
  assert.equal(b.sourceCopies, 0, 'Direct rendering does not use 2D output transfers');
});

test('GPU contexts are created only when their card enters the viewport', async () => {
  const b = await browser({ panelCount: 3 });
  b.setHostTop(1, 900);
  b.setHostTop(2, -600);
  b.paint();
  assert.equal(b.active, 1);
  assert.equal(b.factories.length, 1);
  b.setHostTop(1, 400);
  b.window.fire('scroll');
  assert.equal(b.active, 2);
  assert.equal(b.factories.length, 2);
  assert.equal(b.draws.at(-1).lens.y, 400);
  assert.equal(b.pending, 0);
});

test('GPU failure keeps fallback and stops retrying on every scroll', async () => {
  const b = await browser({ failGPU: true });
  b.paint();
  assert.equal(b.root.dataset.glassEngine, 'native');
  b.window.fire('scroll');
  assert.equal(b.pending, 0);
});

test('lens samples use the wallpaper origin and visual viewport updates draw immediately', async () => {
  const b = await browser();
  b.top = 168; b.canvasTop = 58; b.canvasLeft = 12;
  b.paint();
  assert.equal(b.draws.at(-1).lens.y, 110);
  assert.equal(b.draws.at(-1).lens.x, 23);
  const before = b.draws.length;
  b.top = 180;
  b.window.visualViewport.fire('scroll');
  assert.equal(b.draws.length, before + 1);
  assert.equal(b.draws.at(-1).lens.y, 122, 'New coordinates are drawn before any test frame flush');
  assert.equal(b.pending, 0);
});

test('partial top pull then downward scrolling never toggles the optical layer', async () => {
  const b = await browser(); b.paint();
  for (const delta of [-35, -18, -6]) {
    b.window.fire('wheel', { deltaY: delta }); b.paint();
    assert.notEqual(b.canvas.style.visibility, 'hidden', 'A cancelled refresh must not hide the rim');
    assert.equal(b.root.dataset.glassEngine, 'wallpaper-lens');
    assert.equal(b.active, 1);
  }
  b.window.scrollY = 80; b.top = 30;
  b.window.fire('wheel', { deltaY: 80 }); b.window.fire('scroll');
  assert.equal(b.draws.at(-1).lens.y, 30, 'Continue drawing the downward position in the scroll event');
  b.paint();
  assert.notEqual(b.canvas.style.visibility, 'hidden');
  assert.equal(b.timers, 0, 'No delayed hide/reveal timer');
  b.advance(1000); b.paint();
  assert.equal(b.pending, 0, 'Stop the short alignment pulse after release');
  assert.equal(b.active, 1, 'No renderer replacement during the gesture');
});

test('touch and native rubber-banding track alignment continuously without a material switch', async () => {
  const b = await browser(); b.paint();
  b.window.fire('touchstart', { touches: [{ clientY: 80 }] });
  b.window.fire('touchmove', { touches: [{ clientY: 125 }] }); b.paint();
  assert.notEqual(b.canvas.style.visibility, 'hidden');
  assert.equal(b.pending, 1, 'Track compositor movement briefly even without scroll events');
  b.window.scrollY = -45; b.top = 155; b.canvasTop = 45;
  b.window.fire('scroll');
  assert.equal(b.draws.at(-1).lens.y, 110, 'Rubber-band coordinates are sampled immediately');
  b.paint();
  b.window.fire('touchend');
  b.window.scrollY = 20; b.top = 90; b.canvasTop = 0;
  b.window.fire('scroll');
  assert.equal(b.draws.at(-1).lens.y, 90);
  b.paint();
  assert.notEqual(b.canvas.style.visibility, 'hidden');
  assert.equal(b.root.dataset.glassEngine, 'wallpaper-lens');
  b.advance(1000); b.paint();
  assert.equal(b.pending, 0);
  b.window.scrollY = 2250; b.window.fire('scroll'); b.paint();
  assert.notEqual(b.canvas.style.visibility, 'hidden', 'Bottom bounce keeps the same material too');
  b.document.hidden = true; await b.refresh();
  assert.equal(b.timers, 0);
  assert.equal(b.pending, 0);
});

test('hidden, solid, and accessibility modes release resources and resume', async () => {
  const b = await browser();
  b.paint();
  for (const [disable, enable] of [
    [() => { b.root.dataset.background = 'solid'; }, () => { b.root.dataset.background = 'wallpaper'; }],
    [() => { b.document.hidden = true; }, () => { b.document.hidden = false; }],
    [() => { b.reduced.matches = true; }, () => { b.reduced.matches = false; }],
    [() => { b.contrast.matches = true; }, () => { b.contrast.matches = false; }],
  ]) {
    disable(); await b.refresh();
    assert.equal(b.active, 0);
    assert.equal(b.pending, 0);
    enable(); await b.refresh(); b.paint();
    assert.equal(b.active, 1);
    assert.equal(b.pending, 0);
  }
});

test('viewport geometry stops off-screen drawing and reentry reuses the renderer without observer delay', async () => {
  const b = await browser(); b.paint();
  const before = b.draws.length;
  b.setHostTop(0, 1000);
  b.window.fire('scroll');
  assert.equal(b.draws.length, before, 'Leaving the viewport does not issue a GPU draw');
  assert.equal(b.active, 1, 'Retain the cached renderer for reentry');
  b.setHostTop(0, 70);
  b.window.fire('scroll');
  assert.equal(b.draws.length, before + 1);
  assert.equal(b.draws.at(-1).lens.y, 70, 'A fast reversal samples the current position, not the retained off-screen bitmap');
  assert.equal(b.pending, 0, 'Reentry is drawn in the scroll event without an observer or frame flush');
  assert.equal(b.factories.length, 1, 'Reentry must not recreate the existing renderer');
  b.canvas.fire('webglcontextlost', { preventDefault() {} });
  assert.equal(b.active, 0);
  assert.equal(b.root.dataset.glassEngine, 'native');
  b.canvas.fire('webglcontextrestored');
  await new Promise(setImmediate); b.paint();
  assert.equal(b.active, 1);
  assert.equal(b.factories.length, 2);
});

test('CSS photo transition drawing stops when its animation finishes', async () => {
  const b = await browser(); b.paint();
  b.a.animations = [{ playState: 'running' }];
  b.a.fire('transitionrun', { propertyName: 'opacity' }); b.paint();
  assert.equal(b.pending, 1);
  b.a.animations = []; b.paint();
  assert.equal(b.pending, 0);
});

test('accessible opaque material gives every wallpaper text token 4.5:1', () => {
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/studio.css'), 'utf8');
  const solid = css.match(/@media\s*\(prefers-reduced-transparency:reduce\)[\s\S]*?\.liquid-ready,\.search-dialog,\.wallpaper-dialog\)\s*\{\s*background:(#[\da-f]{6})/i);
  assert.ok(solid, 'Read the real accessibility surface from the stylesheet');
  const bg = [0, 2, 4].map(i => parseInt(solid[1].slice(i + 1, i + 3), 16));
  const tokens = css.match(/:root\[data-background="wallpaper"\]\s*\{[^}]*--ink:([^;]+); --muted:([^;]+); --soft:([^;]+);/);
  assert.ok(tokens);
  const luminance = rgb => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  for (const hex of tokens.slice(1)) {
    const digits = hex.slice(1);
    const full = digits.length === 3 ? [...digits].map(v => v + v).join('') : digits;
    const rgb = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
    const ratio = (luminance(rgb) + .05) / (luminance(bg) + .05);
    assert.ok(ratio >= 4.5, `${hex} contrast is ${ratio.toFixed(2)}:1`);
  }
});
