/* Light for the Big Sur scenery, after Apple's motion and Liquid Glass guidance.
 * One sun is placed from the wallpaper frames' own solar metadata
 * (assets/img/big-sur/apple-solar.json) at the wallpaper time, local or previewed.
 * It lights the sky, the reading panels and the glass toolbar. A mouse or pen nudges
 * the panel reflections and the toolbar's specular edge. Custom properties are written
 * only when they change, there is no scroll listener, and the frame loop runs only
 * while the pointer response settles. Reduced motion, paused scenery or a hidden tab
 * keep the light still. */
(() => {
  'use strict';
  const root = document.documentElement;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  // Apple's samples, each placed at the middle of the site's matching wallpaper period:
  // [minute of day, solar altitude °, azimuth °]. Midday is interpolated between the two
  // daytime samples; at night the sun passes north, below the horizon.
  const anchors = [
    [330, -9, 80],    // dawn, frame 2
    [405, 0, 90],     // sunrise, frame 3
    [525, 10, 100],   // morning, frame 0
    [640, 25, 110],   // day, frame 4, morning side
    [795, 36, 180],   // midday, the sun behind the viewer
    [950, 25, 250],   // day, frame 4, afternoon side
    [1035, 10, 260],  // late afternoon, frame 5
    [1110, 0, 270],   // sunset, frame 6
    [1170, -9, 280],  // dusk, frame 7
    [1260, -25, 290], // night, frame 1
    [1470, -32, 360],
    [1680, -25, 430], // night, frame 1, morning side (70°)
    [1770, -9, 440],  // dawn again
  ];

  // The camera looks up the coast: east (90°) is the land on the right of the frame,
  // west (270°) the ocean on the left. Positions are fractions of the viewport.
  function sunAt(minute) {
    const m = minute < anchors[0][0] ? minute + 1440 : minute;
    let next = 1;
    while (next < anchors.length - 1 && anchors[next][0] <= m) next++;
    const [m0, a0, z0] = anchors[next - 1];
    const [m1, a1, z1] = anchors[next];
    const t = clamp((m - m0) / (m1 - m0));
    const eased = t * t * (3 - 2 * t);
    const altitude = a0 + (a1 - a0) * eased;
    const azimuth = z0 + (z1 - z0) * eased;
    const side = Math.sin(azimuth * Math.PI / 180);
    return {
      altitude,
      azimuth,
      side,
      x: .5 + .44 * side,
      y: altitude >= 0 ? .2 - altitude * .011 : .2 + Math.min(.04, -altitude * .004),
      // Strongest near the horizon, diffuse at midday, gone below twilight.
      glow: altitude >= 0 ? Math.max(.3, .95 - altitude / 55) : Math.max(0, .95 + altitude * .085),
      horizon: Math.exp(-((altitude / 9) ** 2)),
      night: clamp((-altitude - 6) / 14),
    };
  }

  const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
  function wallpaperMinute() {
    const manual = root.dataset.wallpaperTime;
    if (validTime(manual)) return Number(manual.slice(0, 2)) * 60 + Number(manual.slice(3));
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  }

  const written = new WeakMap();
  function setVars(element, values) {
    const previous = written.get(element) || {};
    for (const [name, value] of Object.entries(values)) {
      const text = typeof value === 'number' ? value.toFixed(3) : value;
      if (previous[name] === text) continue;
      element.style.setProperty(name, text);
      previous[name] = text;
    }
    written.set(element, previous);
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lively = () => finePointer.matches && !reducedMotion.matches && !document.hidden &&
    root.dataset.wallpaperMotion !== 'off' && root.dataset.background !== 'solid';
  const fields = [...document.querySelectorAll('.coastal-field')];
  const rims = [...document.querySelectorAll('.header-wrap, .home-page .home-jumps')].map(element => ({ element, x: null }));
  let sun = sunAt(wallpaperMinute());
  let pointer = null;
  const tilt = { x: 0, y: 0 };
  let frame = 0;

  // The specular edge takes the sun's direction across the glass and leans toward a
  // pointer near it.
  function rimTarget(box) {
    const sunX = box.left + box.width * (.5 + (sun.x - .5) * .9);
    if (!pointer || !lively()) return sunX;
    const gap = Math.max(0, Math.abs(pointer.y - (box.top + box.height / 2)) - box.height / 2);
    const pull = clamp(1 - gap / 220) * .75;
    return sunX + (pointer.x - sunX) * pull;
  }
  function placeRims(follow) {
    let moving = false;
    // Read every box before writing, so a write never forces the next read to lay out.
    const boxes = rims.map(rim => rim.element.getBoundingClientRect());
    rims.forEach((rim, index) => {
      const box = boxes[index];
      if (!box.width) return;
      const goal = rimTarget(box);
      rim.x = follow && rim.x !== null ? rim.x + (goal - rim.x) * .14 : goal;
      if (Math.abs(goal - rim.x) > .5) moving = true;
      setVars(rim.element, { '--rim-x': `${(clamp((rim.x - box.left) / box.width, -.1, 1.1) * 100).toFixed(1)}%` });
    });
    return moving;
  }

  function applySun() {
    sun = sunAt(wallpaperMinute());
    setVars(root, {
      '--sun-x': sun.x, '--sun-y': sun.y, '--sun-side': sun.side,
      '--sun-glow': sun.glow, '--horizon-glow': sun.horizon, '--night-glow': sun.night,
    });
    placeRims(false);
  }

  // The first values apply without a transition; later changes, such as dragging the
  // wallpaper time, glide.
  root.classList.add('light-instant');
  applySun();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('light-instant')));

  let timer = 0;
  function schedule() {
    clearTimeout(timer);
    if (document.hidden || validTime(root.dataset.wallpaperTime)) return;
    // The sun moves a quarter of a degree a minute; five minutes is finer than the eye.
    timer = setTimeout(() => { applySun(); schedule(); }, 300000);
  }
  new MutationObserver(records => {
    if (records.some(record => record.attributeName === 'data-wallpaper-time')) { applySun(); schedule(); }
    if (!lively()) rest();
  }).observe(root, { attributes: true, attributeFilter: ['data-wallpaper-time', 'data-wallpaper-motion', 'data-background'] });
  reducedMotion.addEventListener('change', () => { if (!lively()) rest(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) applySun(); schedule(); });
  window.addEventListener('pageshow', event => { if (event.persisted) applySun(); });
  schedule();

  // When motion stops being allowed, the response returns to rest at once rather than
  // staying frozen mid-lean.
  function rest() {
    tilt.x = tilt.y = 0;
    for (const field of fields) setVars(field, { '--light-x': 0, '--light-y': 0 });
    placeRims(false);
  }
  // Pointer response, eased toward its target and stopped once settled.
  function step() {
    frame = 0;
    if (!lively()) { rest(); return; }
    const goalX = pointer ? pointer.x / window.innerWidth * 2 - 1 : 0;
    const goalY = pointer ? pointer.y / window.innerHeight * 2 - 1 : 0;
    tilt.x += (goalX - tilt.x) * .07;
    tilt.y += (goalY - tilt.y) * .07;
    for (const field of fields) setVars(field, { '--light-x': tilt.x, '--light-y': tilt.y });
    const rimsMoving = placeRims(true);
    if (rimsMoving || Math.abs(goalX - tilt.x) > .002 || Math.abs(goalY - tilt.y) > .002) frame = requestAnimationFrame(step);
  }
  const wake = () => { if (!frame && lively()) frame = requestAnimationFrame(step); };
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY };
    wake();
  }, { passive: true });
  document.addEventListener('mouseout', event => { if (!event.relatedTarget) { pointer = null; wake(); } });
  window.addEventListener('resize', () => placeRims(false));
})();
