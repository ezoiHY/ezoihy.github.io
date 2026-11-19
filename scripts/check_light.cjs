#!/usr/bin/env node
'use strict';

// Exercise assets/js/light.js with a deterministic clock and stub DOM.
// Run with: node scripts/check_light.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/light.js'), 'utf8');

function element(box = { left: 217, top: 18, width: 1006, height: 60 }) {
  const properties = new Map();
  const writes = [];
  return {
    properties,
    writes,
    style: { setProperty(name, value) { properties.set(name, value); writes.push([name, value]); } },
    getBoundingClientRect() { return { ...box, right: box.left + box.width, bottom: box.top + box.height }; },
  };
}

function page({ hour = 12, minute = 0, manual = null, fine = true, reduced = false, motion = 'on', hidden = false } = {}) {
  let now = Date.UTC(2026, 10, 19, hour, minute);
  const root = element();
  root.dataset = { wallpaperTime: manual || 'auto', wallpaperMotion: motion, background: 'wallpaper' };
  const classes = new Set();
  root.classList = { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) };
  const header = element();
  const field = element({ left: 217, top: 92, width: 1006, height: 3000 });
  const listeners = { document: new Map(), window: new Map() };
  const register = target => (event, callback) => {
    assert.notEqual(event, 'scroll', 'Light must not install a scroll listener');
    const callbacks = listeners[target].get(event) || [];
    callbacks.push(callback);
    listeners[target].set(event, callbacks);
  };
  const frames = [];
  const timers = new Map();
  let nextTimer = 1;
  let observer;
  const document = {
    documentElement: root,
    hidden,
    addEventListener: register('document'),
    querySelectorAll(selector) {
      if (selector === '.coastal-field') return [field];
      if (selector.includes('.header-wrap')) return [header];
      return [];
    },
  };
  class LocalDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
    getHours() { return new Date(this.getTime()).getUTCHours(); }
    getMinutes() { return new Date(this.getTime()).getUTCMinutes(); }
    getSeconds() { return new Date(this.getTime()).getUTCSeconds(); }
  }
  vm.runInNewContext(source, {
    document,
    window: {
      innerWidth: 1440,
      innerHeight: 900,
      addEventListener: register('window'),
      matchMedia: query => ({ matches: query.includes('reduced-motion') ? reduced : fine, addEventListener() {} }),
    },
    Date: LocalDate,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; }
      observe(target, options) { observer = { target, options, callback: this.callback }; }
    },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
    setTimeout(callback, delay) { const id = nextTimer++; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval() { throw new Error('Light must use a single rescheduled timer'); },
  }, { filename: 'light.js' });

  const value = name => Number(root.properties.get(name));
  return {
    root, header, field, frames, timers, classes,
    get observer() { return observer; },
    sun: () => ({ x: value('--sun-x'), y: value('--sun-y'), side: value('--sun-side'), glow: value('--sun-glow'), horizon: value('--horizon-glow'), night: value('--night-glow') }),
    rim: () => parseFloat(header.properties.get('--rim-x')),
    setLocal(h, m) { now = Date.UTC(2026, 10, 19, h, m); },
    preview(time) {
      root.dataset.wallpaperTime = time;
      observer.callback([{ type: 'attributes', attributeName: 'data-wallpaper-time' }]);
    },
    dispatch(target, event, detail = {}) {
      for (const callback of listeners[target].get(event) || []) callback(detail);
    },
    runFrames() {
      const pending = frames.splice(0);
      pending.forEach(callback => callback(0));
      return pending.length;
    },
    visibility(isHidden) { document.hidden = isHidden; this.dispatch('document', 'visibilitychange'); },
    motion(value) {
      root.dataset.wallpaperMotion = value;
      observer.callback([{ type: 'attributes', attributeName: 'data-wallpaper-motion' }]);
    },
  };
}

test('the sun follows Apple\'s solar metadata across the frame', () => {
  const sunrise = page({ hour: 6, minute: 0 }).sun();
  assert.ok(sunrise.x > .9 && sunrise.side > .95, 'Sunrise lights the land on the right');
  assert.ok(sunrise.horizon > .5, 'A rising sun warms the horizon');
  const sunset = page({ hour: 18, minute: 0 }).sun();
  assert.ok(sunset.x < .1 && sunset.side < -.95, 'Sunset lights the ocean on the left');
  const midday = page({ hour: 13, minute: 15 }).sun();
  assert.ok(Math.abs(midday.x - .5) < .02, 'At midday the sun stands behind the viewer');
  assert.ok(midday.y < 0, 'A high sun lights from above the frame');
  assert.ok(midday.glow < sunset.glow, 'Midday light is more diffuse than sunset light');
  const night = page({ hour: 23, minute: 0 }).sun();
  assert.equal(night.glow, 0);
  assert.equal(night.night, 1);
  const dawn = page({ hour: 5, minute: 30 }).sun();
  assert.ok(dawn.glow > 0 && dawn.glow < sunrise.glow && dawn.night > 0, 'Dawn is between night and sunrise');
});

test('daylight moves continuously from the land to the ocean', () => {
  let previous = Infinity;
  for (let minute = 450; minute <= 1080; minute += 30) {
    const { x } = page({ hour: Math.floor(minute / 60), minute: minute % 60 }).sun();
    assert.ok(x <= previous + 1e-9, `The sun must not move back east at ${minute} minutes`);
    previous = x;
  }
});

test('first values apply without a transition, then later changes glide', () => {
  const p = page({ hour: 9, minute: 0 });
  assert.ok(p.classes.has('light-instant'));
  p.runFrames();
  p.runFrames();
  assert.equal(p.classes.has('light-instant'), false);
});

test('a previewed time overrides the clock and writes only when values change', () => {
  const p = page({ hour: 9, minute: 0, manual: '18:00' });
  assert.ok(p.sun().x < .1, 'The preview, not the local morning, places the sun');
  assert.equal(p.timers.size, 0, 'A fixed preview needs no clock timer');
  const writes = p.root.writes.length;
  p.preview('18:00');
  assert.equal(p.root.writes.length, writes, 'Unchanged values must not be written again');
  p.preview('06:00');
  assert.ok(p.sun().x > .9);
  p.preview('auto');
  assert.equal(p.timers.size, 1, 'Automatic time keeps one slow timer');
  assert.equal([...p.timers.values()][0].delay, 300000);
});

test('hidden tabs cancel the timer and the light refreshes on return', () => {
  const p = page({ hour: 17, minute: 0 });
  assert.equal(p.timers.size, 1);
  p.visibility(true);
  assert.equal(p.timers.size, 0);
  p.setLocal(18, 30);
  p.visibility(false);
  assert.ok(p.sun().x < .1);
  assert.equal(p.timers.size, 1);
});

test('the specular edge stands on the sun\'s side of the glass', () => {
  assert.ok(page({ hour: 6, minute: 0 }).rim() > 80);
  assert.ok(page({ hour: 18, minute: 0 }).rim() < 20);
});

test('the pointer moves the light only when motion is allowed', () => {
  const lively = page({ hour: 12, minute: 0 });
  lively.runFrames();
  lively.runFrames();
  lively.dispatch('window', 'pointermove', { pointerType: 'mouse', clientX: 1300, clientY: 80 });
  assert.equal(lively.frames.length, 1, 'A pointer move requests one frame');
  for (let i = 0; i < 400 && lively.runFrames(); i++);
  assert.ok(Number(lively.field.properties.get('--light-x')) > .7, 'Reflections lean with the pointer');
  assert.ok(lively.rim() > 80, 'The edge leans toward a pointer near the glass');
  assert.equal(lively.frames.length, 0, 'The frame loop stops once settled');

  for (const options of [{ motion: 'off' }, { reduced: true }, { fine: false }]) {
    const still = page({ hour: 12, minute: 0, ...options });
    still.runFrames();
    still.runFrames();
    still.dispatch('window', 'pointermove', { pointerType: 'mouse', clientX: 1300, clientY: 80 });
    assert.equal(still.frames.length, 0, `No pointer response with ${JSON.stringify(options)}`);
  }
  const touch = page({ hour: 12, minute: 0 });
  touch.runFrames();
  touch.runFrames();
  touch.dispatch('window', 'pointermove', { pointerType: 'touch', clientX: 1300, clientY: 80 });
  assert.equal(touch.frames.length, 0, 'Touch does not drive the light');
});

test('switching motion off returns the pointer response to rest', () => {
  const p = page({ hour: 12, minute: 0 });
  p.runFrames();
  p.runFrames();
  p.dispatch('window', 'pointermove', { pointerType: 'mouse', clientX: 1300, clientY: 80 });
  for (let i = 0; i < 400 && p.runFrames(); i++);
  assert.ok(Number(p.field.properties.get('--light-x')) > .7);
  p.motion('off');
  assert.equal(Number(p.field.properties.get('--light-x')), 0, 'Reflections return to rest');
  assert.equal(p.rim(), page({ hour: 12, minute: 0 }).rim(), 'The edge returns to the sun\'s position');
  p.dispatch('window', 'pointermove', { pointerType: 'mouse', clientX: 100, clientY: 80 });
  assert.equal(p.frames.length, 0, 'No response while motion is off');
});
