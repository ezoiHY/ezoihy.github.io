#!/usr/bin/env node
'use strict';

// Exercise the actual browser script with a deterministic local clock and
// controllable image requests. Run with: node scripts/check_wallpaper.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/wallpaper.js'), 'utf8');
const scriptURL = 'https://example.test/profile/assets/js/wallpaper.js';

function browser({ hour = 12, minute = 0, offset = 480, background = 'photo', hidden = false, savedTime = null } = {}) {
  let now = Date.UTC(2026, 9, 13, hour, minute) - offset * 60000;
  let nextTimer = 1;
  let observer;
  const timers = new Map();
  const properties = new Map();
  const writes = [];
  const requests = [];
  const listeners = { document: new Map(), window: new Map() };
  const root = {
    dataset: { background },
    style: { setProperty(name, value) { properties.set(name, value); writes.push([name, value]); } },
    getBoundingClientRect() { throw new Error('Wallpaper must not measure layout'); },
  };
  const register = target => (event, callback) => {
    assert.notEqual(event, 'scroll', 'Wallpaper must not install a scroll listener');
    const callbacks = listeners[target].get(event) || [];
    callbacks.push(callback);
    listeners[target].set(event, callbacks);
  };
  const document = {
    documentElement: root,
    currentScript: { src: scriptURL },
    hidden,
    addEventListener: register('document'),
  };
  const dispatch = (target, event) => {
    for (const callback of listeners[target].get(event) || []) callback();
  };
  class LocalDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
    getHours() { return new Date(this.getTime() + offset * 60000).getUTCHours(); }
    getMinutes() { return new Date(this.getTime() + offset * 60000).getUTCMinutes(); }
  }
  class Image {
    set src(url) {
      const match = /\/big-sur-(\d)\.jpg$/.exec(url);
      assert.ok(match, `Unexpected wallpaper URL: ${url}`);
      requests.push({ image: this, url, frame: Number(match[1]), settled: false });
    }
  }
  class MutationObserver {
    constructor(callback) { this.callback = callback; }
    observe(target, options) { observer = { target, options, callback: this.callback }; }
  }
  vm.runInNewContext(source, {
    document,
    window: { addEventListener: register('window') },
    URL,
    Image,
    MutationObserver,
    Date: LocalDate,
    localStorage: { getItem() { return savedTime; } },
    setTimeout(callback, delay) {
      const id = nextTimer++;
      timers.set(id, { callback, delay, due: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame() { throw new Error('Wallpaper must not run an animation frame loop'); },
    setInterval() { throw new Error('Wallpaper must use the aligned minute timer'); },
  }, { filename: 'wallpaper.js' });

  return {
    root, document, properties, writes, requests, timers, listeners,
    get observer() { return observer; },
    get utcHour() { return new Date(now).getUTCHours(); },
    get visibleFrame() {
      const value = properties.get(`--wallpaper-${root.dataset.wallpaperLayer}-image`);
      return value === 'none' ? null : Number(/big-sur-(\d)\.jpg/.exec(value)[1]);
    },
    setLocal(hour, minute, second = 0, millisecond = 0) {
      now = Date.UTC(2026, 9, 13, hour, minute, second, millisecond) - offset * 60000;
    },
    setOffset(minutes) { offset = minutes; },
    pageshow() { dispatch('window', 'pageshow'); },
    visibility(hidden) { document.hidden = hidden; dispatch('document', 'visibilitychange'); },
    background(value) {
      root.dataset.background = value;
      observer.callback([{ type: 'attributes', attributeName: 'data-background' }]);
    },
    selectTime(value) {
      root.dataset.wallpaperTime = value;
      observer.callback([{ type: 'attributes', attributeName: 'data-wallpaper-time' }]);
    },
    runTimer() {
      assert.equal(timers.size, 1, 'Exactly one minute timer should be pending');
      const [id, timer] = timers.entries().next().value;
      timers.delete(id);
      now = timer.due;
      timer.callback();
    },
    settle(frame, success = true) {
      const request = requests.find(item => item.frame === frame && !item.settled);
      assert.ok(request, `No pending load for frame ${frame}`);
      request.settled = true;
      if (success) request.image.onload();
      else request.image.onerror();
    },
    async flush() {
      // Flush the load continuation and the optional prefetch rejection handler.
      for (let i = 0; i < 8; i++) await Promise.resolve();
    },
  };
}

test('local-time schedule selects both sides of every boundary and wraps at midnight', async () => {
  const cases = [
    [0, 0, 1, 'night'], [4, 59, 1, 'night'],
    [5, 0, 2, 'dawn'], [5, 59, 2, 'dawn'],
    [6, 0, 3, 'sunrise'], [7, 29, 3, 'sunrise'],
    [7, 30, 0, 'morning'], [9, 59, 0, 'morning'],
    [10, 0, 4, 'day'], [16, 29, 4, 'day'],
    [16, 30, 5, 'late-afternoon'], [17, 59, 5, 'late-afternoon'],
    [18, 0, 6, 'sunset'], [18, 59, 6, 'sunset'],
    [19, 0, 7, 'dusk'], [19, 59, 7, 'dusk'],
    [20, 0, 1, 'night'], [23, 59, 1, 'night'],
  ];
  for (const offset of [480, -420]) {
    for (const [hour, minute, frame, period] of cases) {
      const b = browser({ hour, minute, offset });
      assert.equal(b.visibleFrame, frame, `${hour}:${minute}, UTC offset ${offset}`);
      b.settle(frame);
      await b.flush();
      assert.equal(b.root.dataset.wallpaperPeriod, period);
      assert.equal(b.requests.length, 2, 'Only current and next distinct image should load');
      assert.match(b.requests[0].url, /^https:\/\/example\.test\/profile\/assets\/img\/big-sur\//);
    }
  }
});

test('minute timer crosses a boundary without changing the image until loading finishes', async () => {
  const b = browser({ hour: 4, minute: 59 });
  b.settle(1);
  await b.flush();
  const layer = b.root.dataset.wallpaperLayer;
  b.runTimer();
  await b.flush();
  assert.equal(b.visibleFrame, 1);
  assert.equal(b.root.dataset.wallpaperPeriod, 'night');
  b.settle(2);
  await b.flush();
  assert.equal(b.visibleFrame, 2);
  assert.equal(b.root.dataset.wallpaperPeriod, 'dawn');
  assert.notEqual(b.root.dataset.wallpaperLayer, layer);
  assert.equal(b.properties.get(`--wallpaper-${layer}-image`).includes('big-sur-1.jpg'), true);
});

test('midnight retains the night image and prefetches the following dawn', async () => {
  const b = browser({ hour: 23, minute: 59 });
  b.settle(1);
  await b.flush();
  assert.deepEqual(b.requests.map(item => item.frame), [1, 2]);
  const writes = b.writes.length;
  b.runTimer();
  await b.flush();
  assert.equal(b.visibleFrame, 1);
  assert.equal(b.writes.length, writes);
  assert.deepEqual(b.requests.map(item => item.frame), [1, 2]);
});

test('timezone changes and pageshow use the updated local clock', async () => {
  const b = browser({ hour: 10, offset: 480 });
  assert.equal(b.utcHour, 2);
  b.settle(4);
  await b.flush();
  b.setOffset(0);
  b.pageshow();
  b.settle(1);
  await b.flush();
  assert.equal(b.visibleFrame, 1);
  assert.equal(b.root.dataset.wallpaperPeriod, 'night');
  assert.equal(b.timers.size, 1);
});

test('hidden tabs cancel the clock, reject in-flight changes, and refresh on return', async () => {
  const b = browser({ hour: 4, minute: 59 });
  b.settle(1);
  await b.flush();
  b.setLocal(5, 0);
  b.pageshow();
  b.visibility(true);
  assert.equal(b.timers.size, 0);
  b.settle(2);
  await b.flush();
  assert.equal(b.visibleFrame, 1);
  const count = b.requests.length;
  b.setLocal(6, 0);
  b.pageshow();
  assert.equal(b.requests.length, count);
  assert.equal(b.timers.size, 0);
  b.visibility(false);
  b.settle(3);
  await b.flush();
  assert.equal(b.visibleFrame, 3);
  assert.equal(b.timers.size, 1);
});

test('solid mode starts without image requests and resumes at the current time', async () => {
  const b = browser({ hour: 12, background: 'solid' });
  assert.equal(b.visibleFrame, null);
  assert.equal(b.requests.length, 0);
  assert.equal(b.timers.size, 0);
  assert.equal(b.observer.target, b.root);
  assert.deepEqual(Array.from(b.observer.options.attributeFilter), ['data-background', 'data-wallpaper-time']);
  b.setLocal(18, 0);
  b.background('photo');
  assert.equal(b.visibleFrame, null);
  b.settle(6);
  await b.flush();
  assert.equal(b.visibleFrame, 6);
  assert.equal(b.root.dataset.wallpaperPeriod, 'sunset');
  assert.equal(b.timers.size, 1);
  b.setLocal(19, 0);
  b.pageshow();
  b.background('solid');
  b.settle(7);
  await b.flush();
  assert.equal(b.visibleFrame, 6, 'An in-flight load must not replace the previous frame in solid mode');
  assert.equal(b.timers.size, 0);
  b.background('photo');
  await b.flush();
  assert.equal(b.visibleFrame, 7);
  assert.equal(b.timers.size, 1);
});

test('saved manual time overrides the local clock without an automatic timer or prefetch', async () => {
  const b = browser({ hour: 12, savedTime: '22:00' });
  assert.equal(b.visibleFrame, 1);
  assert.equal(b.root.dataset.wallpaperTime, '22:00');
  b.settle(1);
  await b.flush();
  assert.deepEqual(b.requests.map(item => item.frame), [1]);
  assert.equal(b.timers.size, 0);
  b.setLocal(6, 0);
  b.pageshow();
  await b.flush();
  assert.equal(b.visibleFrame, 1);
});

test('manual preview crosses scenes and returning to automatic restores the local time', async () => {
  const b = browser({ hour: 12 });
  b.settle(4);
  await b.flush();
  b.selectTime('18:00');
  assert.equal(b.timers.size, 0);
  assert.equal(b.visibleFrame, 4, 'Wait for the new scene to load');
  b.settle(6);
  await b.flush();
  assert.equal(b.visibleFrame, 6);
  assert.equal(b.root.dataset.wallpaperPeriod, 'sunset');
  b.setLocal(7, 30);
  b.selectTime('auto');
  assert.equal(b.timers.size, 1);
  b.settle(0);
  await b.flush();
  assert.equal(b.visibleFrame, 0);
  assert.equal(b.root.dataset.wallpaperPeriod, 'morning');
});

test('invalid saved times safely fall back to the automatic clock', () => {
  for (const savedTime of ['24:00', '8:30', 'noon', '12:99', '', 'auto']) {
    const b = browser({ hour: 12, savedTime });
    assert.equal(b.visibleFrame, 4);
    assert.equal(b.root.dataset.wallpaperTime, 'auto');
    assert.equal(b.timers.size, 1);
  }
});

test('a failed image preserves the previous photograph and is retried later', async () => {
  const b = browser({ hour: 4, minute: 59 });
  b.settle(1);
  await b.flush();
  b.setLocal(5, 0);
  b.pageshow();
  const writes = b.writes.length;
  b.settle(2, false);
  await b.flush();
  assert.equal(b.visibleFrame, 1);
  assert.equal(b.root.dataset.wallpaperPeriod, 'night');
  assert.equal(b.writes.length, writes);
  b.pageshow();
  assert.equal(b.requests.filter(item => item.frame === 2).length, 2);
  b.settle(2);
  await b.flush();
  assert.equal(b.visibleFrame, 2);
});

test('an older image load cannot overwrite a newer clock selection', async () => {
  const b = browser({ hour: 4, minute: 59 });
  b.settle(1);
  await b.flush();
  b.setLocal(5, 0);
  b.pageshow();
  b.setLocal(6, 0);
  b.pageshow();
  b.settle(3);
  await b.flush();
  assert.equal(b.visibleFrame, 3);
  const writes = b.writes.length;
  b.settle(2);
  await b.flush();
  assert.equal(b.visibleFrame, 3);
  assert.equal(b.root.dataset.wallpaperPeriod, 'sunrise');
  assert.equal(b.writes.length, writes);
});

test('repeated refreshes keep one aligned minute timer and reuse current images', async () => {
  const b = browser();
  b.settle(4);
  await b.flush();
  b.setLocal(12, 0, 42, 123);
  for (let i = 0; i < 10; i++) b.pageshow();
  await b.flush();
  assert.equal(b.timers.size, 1);
  assert.equal(b.timers.values().next().value.delay, 17927);
  assert.deepEqual(b.requests.map(item => item.frame), [4, 5]);
  assert.equal(b.writes.length, 1, 'An unchanged frame does not restart the crossfade');
  assert.equal(b.listeners.document.has('scroll'), false);
  assert.equal(b.listeners.window.has('scroll'), false);
});
