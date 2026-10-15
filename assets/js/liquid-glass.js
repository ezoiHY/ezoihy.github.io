/*
 * liquid-glass-web patterns C/E: the known wallpaper is sampled through the
 * skill's optical map outside WebKit. Those cards render into their GPU canvas,
 * without a WebGL-to-2D snapshot between the draw and browser compositing.
 * WebKit uses native fixed sources and clips, without JS sampling on scroll.
 */
import { engine } from '../vendor/gentpan-liquidglass.js';

const root = document.documentElement;
const hosts = [...document.querySelectorAll('[data-liquid-glass]')];
const wallpaper = document.querySelector('.desktop-wallpaper');
root.dataset.glassEngine = 'native';

const layer = className => {
  const el = document.createElement('span');
  el.className = `${className} liquid-effect`;
  el.setAttribute('aria-hidden', 'true');
  return el;
};
const surfaces = hosts.map(host => {
  host.prepend(layer('liquid-warp'), layer('liquid-shade'));
  host.append(layer('liquid-rim'));
  host.classList.add('liquid-ready');
  return { host, radius: 32 };
});

async function enableRefraction() {
  if (!wallpaper || !surfaces.length) return;
  if (engine === 'webkit') {
    // Native scrolling may outrun JavaScript even with direct GPU drawing.
    // WebKit uses viewport-fixed photo sources and card-local CSS clips: the
    // compositor owns both their coordinates. Static small offsets approximate
    // the rim bend; there is no per-scroll photo sampling or canvas at all.
    for (const surface of surfaces) {
      const optics = layer('liquid-native-optics');
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const edge = document.createElement('span');
        edge.className = `liquid-native-edge liquid-native-${side}`;
        for (const photo of ['a', 'b']) {
          const source = document.createElement('span');
          source.className = `wallpaper-layer wallpaper-${photo} liquid-native-source`;
          edge.append(source);
        }
        optics.append(edge);
      }
      surface.host.prepend(optics);
    }
    return;
  }
  for (const surface of surfaces) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    canvas.className = 'liquid-surface-canvas liquid-effect';
    canvas.setAttribute('aria-hidden', 'true');
    surface.host.prepend(canvas);
    surface.canvas = canvas;
  }
  let makeRenderer;
  try {
    ({ createWallpaperLens: makeRenderer } = await import('./glass-wallpaper.js'));
  } catch {
    surfaces.forEach(surface => surface.canvas.remove());
    return; // Crisp CSS tint/rim remains usable without the optional renderer.
  }
  let frame = 0;
  let blending = false;
  let unavailable = false;
  let edgeTrackingUntil = 0;
  let images = [null, null];
  const photoCache = new Map();
  let sourceGeneration = 0;
  const reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)');
  const highContrast = matchMedia('(prefers-contrast: more)');
  const a = wallpaper.querySelector('.wallpaper-a');
  const b = wallpaper.querySelector('.wallpaper-b');
  const enabled = () => !unavailable && root.dataset.background === 'wallpaper' &&
    !reducedTransparency.matches && !highContrast.matches && !document.hidden;

  function release() {
    cancelAnimationFrame(frame);
    edgeTrackingUntil = 0;
    touchY = null;
    edgeTouch = false;
    frame = 0;
    for (const surface of surfaces) {
      surface.renderer?.destroy();
      surface.renderer = null;
      surface.canvas.width = surface.canvas.height = 1;
    }
    if (root.dataset.glassEngine !== 'native') root.dataset.glassEngine = 'native';
  }
  function schedule() {
    if (!frame && enabled()) frame = requestAnimationFrame(paint);
  }
  function updateNow() {
    // Scroll already describes the current native position. Submit the new
    // sample in this event, without deferring it through another queued frame.
    cancelAnimationFrame(frame);
    frame = 0;
    if (enabled()) paint();
  }
  function paint() {
    frame = 0;
    if (!enabled()) { release(); return; }
    if (!images[0] && !images[1]) return;
    try {
      // These coordinates affect photo sampling only. Each optical silhouette
      // is always drawn at (0, 0) inside its card, never on the fixed wallpaper.
      const origin = wallpaper.getBoundingClientRect();
      // Measure the few hosts directly. An asynchronous visibility callback
      // can lag a fast scroll reversal and otherwise retain an old photo sample.
      const lenses = surfaces.map(surface => {
        const rect = surface.host.getBoundingClientRect();
        return {
          id: surface.host,
          canvas: surface.canvas,
          x: rect.left - origin.left, y: rect.top - origin.top,
          width: Math.round(rect.width * 64) / 64,
          height: Math.round(rect.height * 64) / 64,
          radius: surface.radius,
          compact: surface.host.dataset.liquidGlass !== 'panel',
        };
      }).filter(lens => lens.width > 0 && lens.height > 0 &&
        lens.y < wallpaper.clientHeight + 80 && lens.y + lens.height > -80);
      const opacity = [
        Number(getComputedStyle(a).opacity), Number(getComputedStyle(b).opacity),
      ];
      const scene = { width: wallpaper.clientWidth, height: wallpaper.clientHeight };
      for (const lens of lenses) {
        const surface = byHost.get(lens.id);
        surface.renderer ??= makeRenderer(surface.canvas);
        surface.renderer.render(images, lens, opacity, scene);
      }
      if (root.dataset.glassEngine !== 'wallpaper-lens') root.dataset.glassEngine = 'wallpaper-lens';
      if (blending) blending = [a, b].some(node =>
        node.getAnimations().some(animation => animation.playState === 'running'));
      if (performance.now() >= edgeTrackingUntil) edgeTrackingUntil = 0;
      if (blending || edgeTrackingUntil) schedule();
    } catch {
      release();
      unavailable = true;
    }
  }

  async function loadSources() {
    const generation = ++sourceGeneration;
    const used = new Set();
    const loaded = await Promise.all([a, b].map(async node => {
      const match = getComputedStyle(node).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
      if (!match) return null;
      try {
        const url = new URL(match[1], location.href);
        if (url.origin !== location.origin) return null;
        used.add(url.href);
        if (!photoCache.has(url.href)) {
          const image = new Image();
          image.decoding = 'async';
          image.src = url.href;
          photoCache.set(url.href, image.decode().then(() => {
            // Decode/downsample once, shared by all card contexts. This bounds
            // per-context photo memory without copying any pixels on scroll.
            const scale = Math.min(1, 1536 / image.naturalWidth, 1536 / image.naturalHeight);
            if (!(scale < 1)) return image;
            const photo = document.createElement('canvas');
            photo.width = Math.max(1, Math.round(image.naturalWidth * scale));
            photo.height = Math.max(1, Math.round(image.naturalHeight * scale));
            photo.getContext('2d').drawImage(image, 0, 0, photo.width, photo.height);
            return photo;
          }));
        }
        return await photoCache.get(url.href);
      } catch { return null; }
    }));
    if (generation !== sourceGeneration) return;
    for (const url of photoCache.keys()) if (!used.has(url)) photoCache.delete(url);
    images = loaded;
    schedule();
  }
  function refresh() {
    if (!enabled()) release();
    else { loadSources(); schedule(); }
  }
  function measure() {
    for (const surface of surfaces) {
      surface.radius = parseFloat(getComputedStyle(surface.host).borderTopLeftRadius) || 28;
    }
    schedule();
  }
  function edgePosition() {
    const y = window.scrollY || 0;
    const height = document.scrollingElement?.scrollHeight || root.scrollHeight || 0;
    return { y, bottom: Math.max(0, height - window.innerHeight) };
  }
  function pullingEdge(delta) {
    const { y, bottom } = edgePosition();
    return (y <= 0 && delta < 0) || (y >= bottom && delta > 0);
  }
  function trackEdge() {
    if (!enabled()) return;
    // Native rubber-banding can move compositor layers without scroll events.
    // Keep the same material visible and track its geometry through the bounce.
    // A delayed hide/reveal would flash when a partial pull turns into a scroll.
    edgeTrackingUntil = performance.now() + 450;
    schedule();
  }
  const byHost = new Map(surfaces.map(surface => [surface.host, surface]));
  const resize = new ResizeObserver(measure);
  surfaces.forEach(({ host }) => resize.observe(host));
  resize.observe(wallpaper);
  // Scrolling changes uniforms only: no optical-map generation, photograph
  // upload, output bitmap resize, or intermediate canvas copy.
  window.addEventListener('scroll', () => {
    const { y, bottom } = edgePosition();
    if (y < 0 || y > bottom) trackEdge();
    updateNow();
  }, { passive: true });
  window.addEventListener('wheel', event => {
    if (!event.ctrlKey && pullingEdge(event.deltaY)) trackEdge();
  }, { passive: true });
  let touchY = null;
  let edgeTouch = false;
  window.addEventListener('touchstart', event => {
    touchY = event.touches[0]?.clientY ?? null;
    edgeTouch = false;
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    const next = event.touches[0]?.clientY;
    if (next === undefined || touchY === null) return;
    if (pullingEdge(touchY - next)) {
      edgeTouch = true;
      trackEdge();
    }
    touchY = next;
  }, { passive: true });
  const endTouch = () => {
    touchY = null;
    if (edgeTouch) trackEdge();
    edgeTouch = false;
  };
  window.addEventListener('touchend', endTouch, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.visualViewport?.addEventListener('resize', measure, { passive: true });
  window.visualViewport?.addEventListener('scroll', updateNow, { passive: true });
  for (const node of [a, b]) {
    node.addEventListener('transitionrun', event => {
      if (event.propertyName === 'opacity') { blending = true; schedule(); }
    });
    const end = event => {
      if (event.propertyName === 'opacity') { blending = false; schedule(); }
    };
    node.addEventListener('transitionend', end);
    node.addEventListener('transitioncancel', end);
  }
  new MutationObserver(refresh).observe(root, {
    attributes: true,
    attributeFilter: ['data-background', 'data-wallpaper-layer', 'data-theme'],
  });
  reducedTransparency.addEventListener('change', refresh);
  highContrast.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('pagehide', release);
  window.addEventListener('pageshow', refresh);
  for (const surface of surfaces) {
    surface.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      unavailable = true;
      release();
    });
    surface.canvas.addEventListener('webglcontextrestored', () => {
      unavailable = false;
      refresh();
    });
  }
  measure();
  refresh();
}
enableRefraction();
