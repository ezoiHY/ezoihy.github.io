#!/usr/bin/env node
'use strict';

// Run the real carousel script with a small DOM and a deterministic clock.
// These checks cover interaction and accessibility state, not rendered pixels.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/project-carousel.js'), 'utf8');

function target(parent = null) {
  const listeners = new Map();
  return {
    parent,
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    dispatch(type, details = {}) {
      const event = {
        type, target: this, detail: 0, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        ...details,
      };
      for (let node = this; node; node = node.parent) {
        node.notify(event);
        // pointerenter/leave do not bubble, unlike focusin and click.
        if (type === 'pointerenter' || type === 'pointerleave') break;
      }
      return event;
    },
    notify(event) {
      for (const callback of listeners.get(event.type) || []) callback(event);
    },
  };
}

function element(parent) {
  const attributes = new Map();
  const classes = new Set();
  return Object.assign(target(parent), {
    dataset: {}, hidden: false, inert: false, textContent: '',
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
      contains(name) { return classes.has(name); },
    },
  });
}

function browser({ reducedMotion = false, hidden = false, intersection = true, slideCount = 6, missing = null, present = true } = {}) {
  let now = 0;
  let serial = 0;
  let observer;
  const timers = new Map();
  const document = Object.assign(target(), { hidden });
  const carousel = element(document);
  const controls = element(carousel);
  controls.hidden = true;
  const previous = element(controls), next = element(controls), toggle = element(controls);
  const count = element(controls), status = element(controls);
  const slides = Array.from({ length: slideCount }, (_, i) => {
    const slide = element(carousel);
    slide.querySelector = selector => selector === 'h3' ? { textContent: `Project ${i + 1}` } : null;
    return slide;
  });
  const nodes = { controls, previous, next, toggle, count, status };
  document.querySelector = () => present ? carousel : null;
  carousel.querySelectorAll = () => slides;
  carousel.querySelector = selector => {
    const key = selector.replace('[data-carousel-', '').replace(']', '');
    return key === missing ? null : nodes[key] || null;
  };
  const motion = Object.assign(target(), { matches: reducedMotion });
  class IntersectionObserver {
    constructor(callback) { observer = callback; }
    observe(node) { assert.equal(node, carousel); }
  }
  const window = {
    matchMedia() { return motion; },
    setTimeout(callback, delay) {
      const id = ++serial;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  };
  if (intersection) window.IntersectionObserver = IntersectionObserver;
  vm.runInNewContext(source, { document, window, IntersectionObserver }, { filename: 'project-carousel.js' });

  return {
    carousel, controls, previous, next, toggle, count, status, slides, timers,
    get active() { return slides.findIndex(slide => slide.classList.contains('is-active')); },
    advance(ms) {
      const until = now + ms;
      let iterations = 0;
      while (true) {
        const pending = [...timers.entries()].filter(([, timer]) => timer.due <= until).sort((a, b) => a[1].due - b[1].due)[0];
        if (!pending) break;
        assert.ok(++iterations < 100, 'Timer loop must not spin');
        const [id, timer] = pending;
        now = timer.due;
        timers.delete(id);
        timer.callback();
      }
      now = until;
    },
    visibility(value) { document.hidden = value; document.dispatch('visibilitychange'); },
    intersection(ratio, isIntersecting = ratio > 0) {
      assert.ok(observer, 'Intersection observer is installed');
      observer([{ target: carousel, isIntersecting, intersectionRatio: ratio }]);
    },
    reducedMotion(value) { motion.matches = value; motion.dispatch('change', { matches: value }); },
    pointerClickToggle(pointerType = 'touch') {
      toggle.dispatch('pointerdown', { pointerType });
      toggle.dispatch('focusin');
      toggle.dispatch('click', { pointerType, detail: 1 });
    },
  };
}

function expectActive(b, index) {
  assert.equal(b.active, index);
  assert.equal(b.count.textContent, `${index + 1} / ${b.slides.length}`);
  b.slides.forEach((slide, position) => {
    const active = position === index;
    assert.equal(slide.inert, !active, 'Only the active slide may receive focus');
    assert.equal(slide.getAttribute('aria-hidden'), String(!active));
    assert.equal(slide.getAttribute('aria-roledescription'), 'slide');
    assert.equal(slide.getAttribute('aria-label'), `${position + 1} of ${b.slides.length}`);
  });
}

test('automatic rotation wraps through all six projects without live announcements', () => {
  const b = browser();
  expectActive(b, 0);
  assert.equal(b.controls.hidden, false);
  b.intersection(1);
  for (let i = 1; i <= 7; i++) {
    b.advance(6000);
    expectActive(b, i % 6);
    assert.equal(b.status.textContent, '');
    assert.equal(b.timers.size, 1);
  }
});

test('visibility and viewport notifications maintain exactly one pending rotation', () => {
  const b = browser();
  for (let i = 0; i < 10; i++) {
    b.intersection(1);
    b.visibility(false);
    assert.equal(b.timers.size, 1);
  }
  b.advance(5999);
  expectActive(b, 0);
  b.advance(1);
  expectActive(b, 1);
  assert.equal(b.timers.size, 1);
});

test('pointer Pause honors its state before focusin; a subsequent Play resumes', () => {
  const b = browser({ intersection: false });
  assert.equal(b.toggle.textContent, 'Pause');
  b.pointerClickToggle();
  assert.equal(b.toggle.textContent, 'Play');
  assert.equal(b.toggle.getAttribute('aria-label'), 'Start automatic project rotation');
  assert.equal(b.timers.size, 0);
  b.advance(12000);
  expectActive(b, 0);
  b.pointerClickToggle();
  assert.equal(b.toggle.textContent, 'Pause');
  assert.equal(b.timers.size, 1);
  b.advance(6000);
  expectActive(b, 1);
});

test('manual previous and next wrap, announce the project, and stop autoplay', () => {
  const b = browser({ intersection: false });
  b.previous.dispatch('click');
  expectActive(b, 5);
  assert.equal(b.status.textContent, '6 of 6: Project 6');
  assert.equal(b.toggle.textContent, 'Play');
  b.next.dispatch('click');
  expectActive(b, 0);
  assert.equal(b.status.textContent, '1 of 6: Project 1');
  assert.equal(b.timers.size, 0);
  b.advance(60000);
  expectActive(b, 0);
});

test('keyboard arrows navigate only the controls and explicit Play resumes after focus', () => {
  const b = browser({ intersection: false });
  b.toggle.dispatch('focusin');
  assert.equal(b.toggle.textContent, 'Play');
  assert.equal(b.timers.size, 0);
  const right = b.next.dispatch('keydown', { key: 'ArrowRight' });
  assert.equal(right.defaultPrevented, true);
  expectActive(b, 1);
  const left = b.previous.dispatch('keydown', { key: 'ArrowLeft' });
  assert.equal(left.defaultPrevented, true);
  expectActive(b, 0);
  assert.equal(b.controls.dispatch('keydown', { key: 'Tab' }).defaultPrevented, false);
  assert.equal(b.slides[0].dispatch('keydown', { key: 'ArrowRight' }).defaultPrevented, false);
  expectActive(b, 0);
  b.toggle.dispatch('click', { detail: 0 });
  assert.equal(b.toggle.textContent, 'Pause');
  b.advance(6000);
  expectActive(b, 1);
  b.slides[1].dispatch('focusin');
  assert.equal(b.timers.size, 0);
});

test('mouse and pen hover suspend rotation while touch entry does not', () => {
  for (const pointerType of ['mouse', 'pen']) {
    const b = browser({ intersection: false });
    b.carousel.dispatch('pointerenter', { pointerType });
    assert.equal(b.timers.size, 0);
    b.advance(12000);
    expectActive(b, 0);
    b.carousel.dispatch('pointerleave', { pointerType });
    assert.equal(b.timers.size, 1);
    b.advance(6000);
    expectActive(b, 1);
  }
  const touch = browser({ intersection: false });
  touch.carousel.dispatch('pointerenter', { pointerType: 'touch' });
  touch.advance(6000);
  expectActive(touch, 1);
  touch.carousel.dispatch('pointerleave', { pointerType: 'touch' });
  assert.equal(touch.timers.size, 1);
});

test('leaving hover or returning to the page never overrides a user pause', () => {
  const b = browser();
  b.intersection(1);
  b.carousel.dispatch('pointerenter', { pointerType: 'mouse' });
  b.pointerClickToggle('mouse');
  b.carousel.dispatch('pointerleave', { pointerType: 'mouse' });
  b.visibility(true);
  b.visibility(false);
  b.intersection(0);
  b.intersection(1);
  assert.equal(b.timers.size, 0);
  assert.equal(b.toggle.textContent, 'Play');
});

test('hidden pages and offscreen carousels do not rotate or catch up on return', () => {
  const b = browser({ hidden: true });
  b.intersection(1);
  assert.equal(b.timers.size, 0);
  b.advance(60000);
  expectActive(b, 0);
  b.visibility(false);
  assert.equal(b.timers.size, 1);
  b.advance(6000);
  expectActive(b, 1);
  b.intersection(.24);
  assert.equal(b.timers.size, 0);
  b.advance(60000);
  expectActive(b, 1);
  b.intersection(.25);
  b.advance(5999);
  expectActive(b, 1);
  b.advance(1);
  expectActive(b, 2);
  b.visibility(true);
  assert.equal(b.timers.size, 0);
});

test('reduced motion starts paused and changing preferences stops an active rotation', () => {
  const b = browser({ reducedMotion: true, intersection: false });
  assert.equal(b.toggle.textContent, 'Play');
  assert.equal(b.timers.size, 0);
  b.advance(60000);
  expectActive(b, 0);
  b.reducedMotion(false);
  assert.equal(b.timers.size, 0, 'A preference change must not silently enable motion');
  b.toggle.dispatch('click', { detail: 0 });
  b.advance(6000);
  expectActive(b, 1);
  b.reducedMotion(true);
  assert.equal(b.toggle.textContent, 'Play');
  assert.equal(b.timers.size, 0);
  b.reducedMotion(false);
  b.advance(60000);
  expectActive(b, 1);
});

test('absent, single-slide, and incomplete carousels remain static and readable', () => {
  for (const options of [{ present: false }, { slideCount: 1 }, { missing: 'toggle' }]) {
    const b = browser(options);
    assert.equal(b.carousel.dataset.carouselReady, undefined);
    assert.equal(b.controls.hidden, true);
    assert.equal(b.timers.size, 0);
    assert.ok(b.slides.every(slide => !slide.inert && slide.getAttribute('aria-hidden') === null));
  }
});

test('source markup keeps project content accessible before JavaScript runs', () => {
  const template = fs.readFileSync(path.join(root, '_includes/selected-project.liquid'), 'utf8');
  const home = fs.readFileSync(path.join(root, '_pages/home.html'), 'utf8');
  const article = template.match(/<article\b[^>]*data-project-slide[^>]*>/)?.[0];
  assert.ok(article, 'Project slide markup is present');
  assert.doesNotMatch(article, /\b(?:hidden|inert|aria-hidden)\b/);
  assert.match(template, /<h3>\s*<a\b[^>]*href=/, 'Every project retains its ordinary title link');
  assert.match(home, /<div\b[^>]*data-carousel-controls[^>]*\bhidden\b/, 'Inactive controls stay hidden until enhancement succeeds');
  assert.doesNotMatch(home, /\bdata-carousel-ready\b/, 'The server output never starts in the enhanced state');
});
