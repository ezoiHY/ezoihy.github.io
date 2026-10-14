/*
 * Site integration of gentpan/liquidglass (MIT, vendored unchanged).
 * Fixed-background refraction follows Meapri/liquid-glass-web's documented
 * refractBackground approach. See UPSTREAM.md for revisions and licenses.
 *
 * Safari can render the SVG lens, but filtering viewport-fixed image copies
 * across large scrolling panels is too expensive. WebKit and iOS use native
 * frost: no panel image copies, generated maps, or panel lens observers.
 * Small interactive lenses live separately in glass-controls.js.
 */
const root = document.documentElement;
const hosts = [...document.querySelectorAll('[data-liquid-glass]')];
const ua = navigator.userAgent;
const ios = /iPhone|iPad|iPod/.test(ua) ||
  (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const webkit = /AppleWebKit/.test(ua) && !/(?:Chrome|Chromium|Edg)\//.test(ua);
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
  return { host, compact: host.dataset.liquidGlass !== 'panel', glass: null, visible: true };
});

async function enableRefraction() {
  // A capability test for filter:url() cannot detect its scrolling cost.
  // Keep this explicit performance fallback ahead of the dynamic import.
  if (ios || webkit || !surfaces.length) return;
  let createGlass;
  try {
    ({ createGlass } = await import('../vendor/gentpan-liquidglass.js'));
  } catch {
    return; // The native material already works if the optional module fails.
  }
  root.dataset.glassEngine = 'image-refraction';
  const reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)');
  surfaces.forEach(surface => {
    const optics = layer('liquid-optics');
    optics.append(layer('liquid-photo liquid-photo-a'), layer('liquid-photo liquid-photo-b'));
    surface.host.prepend(optics);
    surface.optics = optics;
  });
  const enabled = () => root.dataset.background === 'wallpaper' &&
    !reducedTransparency.matches && !document.hidden;

  function update(surface) {
    const { host, optics, compact } = surface;
    if (!enabled() || !surface.visible) {
      surface.glass?.destroy();
      surface.glass = null;
      host.classList.remove('liquid-refracting');
      return;
    }
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    if (!w || !h) return;
    const radius = parseFloat(getComputedStyle(host).borderTopLeftRadius) || 28;
    const options = {
      fit: true,
      radius,
      refraction: compact ? 20 : 28,
      bezel: Math.min(1, (compact ? 18 : 28) / (Math.min(w, h) / 2)),
      curvature: 3,
      ior: 1.5,
      blur: compact ? .75 : 1.5,
      chroma: .035,
      specular: compact ? .55 : .48,
      specularWidth: 1.5,
      mapScale: Math.min(.75, Math.sqrt(320000 / (w * h))),
    };
    try {
      if (surface.glass) surface.glass.update(options);
      else surface.glass = createGlass(optics, options);
      host.classList.add('liquid-refracting');
    } catch {
      surface.glass?.destroy();
      surface.glass = null;
      host.classList.remove('liquid-refracting');
    }
  }

  const byHost = new Map(surfaces.map(surface => [surface.host, surface]));
  const resize = new ResizeObserver(entries => {
    for (const entry of entries) update(byHost.get(entry.target));
  });
  surfaces.forEach(({ host }) => resize.observe(host));
  // CSS owns image alignment; scrolling never samples wallpaper coordinates.
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const surface = byHost.get(entry.target);
        surface.visible = entry.isIntersecting;
        update(surface);
      }
    }, { rootMargin: '180px' });
    surfaces.forEach(({ host }) => visibility.observe(host));
  }

  function refresh() {
    surfaces.forEach(surface => {
      update(surface);
      surface.glass?.flush();
    });
  }
  new MutationObserver(refresh).observe(root, {
    attributes: true,
    attributeFilter: ['data-background', 'data-wallpaper-layer', 'data-theme'],
  });
  reducedTransparency.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('pageshow', refresh);
  refresh();
}
enableRefraction();
