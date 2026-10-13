/*
 * DOM port of rdev/liquid-glass-react, src/index.tsx (MIT).
 * Original standard displacement texture, RGB filter, and screen/overlay rims.
 * See assets/vendor/liquid-glass-react.LICENSE.txt and UPSTREAM.md.
 *
 * The browser samples the real backdrop. No wallpaper copies, scroll handlers,
 * canvas-generated maps, geometry polling, or perpetual JavaScript animation.
 * As in upstream, Safari/Firefox retain native blur but not SVG displacement.
 */
(() => {
  'use strict';
  const hosts = [...document.querySelectorAll('[data-liquid-glass]')];
  if (!hosts.length) return;
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const scriptURL = document.currentScript?.src;
  const mapURL = new URL('../vendor/liquid-glass-displacement.jpg', scriptURL || location.href).href;
  const ns = 'http://www.w3.org/2000/svg';
  const userAgent = navigator.userAgent.toLowerCase();
  const nativeOnly = /firefox|fxios|iphone|ipad|ipod/.test(userAgent) || (userAgent.includes('applewebkit') && !/(chrome|chromium|crios|edg|opr)/.test(userAgent));
  root.dataset.glassEngine = nativeOnly ? 'native' : 'svg';
  const node = (tag, attributes = {}) => {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
    return element;
  };
  const layer = className => {
    const element = document.createElement('span');
    element.className = `${className} liquid-effect`;
    element.setAttribute('aria-hidden', 'true');
    return element;
  };

  function createFilter(id, displacement) {
    const svg = node('svg', { class: 'liquid-defs liquid-effect', 'aria-hidden': 'true', focusable: 'false' });
    const defs = node('defs');
    const filter = node('filter', { id, x: '-35%', y: '-35%', width: '170%', height: '170%', 'color-interpolation-filters': 'sRGB' });
    filter.append(node('feImage', { x: 0, y: 0, width: '100%', height: '100%', result: 'DISPLACEMENT_MAP', href: mapURL, preserveAspectRatio: 'xMidYMid slice' }));
    filter.append(node('feColorMatrix', { in: 'DISPLACEMENT_MAP', type: 'matrix', values: '.3 .3 .3 0 0 .3 .3 .3 0 0 .3 .3 .3 0 0 0 0 0 1 0', result: 'EDGE_INTENSITY' }));
    const edgeTransfer = node('feComponentTransfer', { in: 'EDGE_INTENSITY', result: 'EDGE_MASK' });
    edgeTransfer.append(node('feFuncA', { type: 'discrete', tableValues: '0 0.1 1' }));
    filter.append(edgeTransfer, node('feOffset', { in: 'SourceGraphic', dx: 0, dy: 0, result: 'CENTER_ORIGINAL' }));
    const scales = [];
    ['RED', 'GREEN', 'BLUE'].forEach((name, channel) => {
      const displaced = node('feDisplacementMap', { in: 'SourceGraphic', in2: 'DISPLACEMENT_MAP', scale: -displacement * (1 + channel * .1), xChannelSelector: 'R', yChannelSelector: 'B', result: `${name}_DISPLACED` });
      scales.push(displaced);
      const matrix = Array(20).fill(0);
      matrix[channel * 5 + channel] = 1; matrix[18] = 1;
      filter.append(displaced, node('feColorMatrix', { in: `${name}_DISPLACED`, type: 'matrix', values: matrix.join(' '), result: `${name}_CHANNEL` }));
    });
    filter.append(
      node('feBlend', { in: 'GREEN_CHANNEL', in2: 'BLUE_CHANNEL', mode: 'screen', result: 'GB_COMBINED' }),
      node('feBlend', { in: 'RED_CHANNEL', in2: 'GB_COMBINED', mode: 'screen', result: 'RGB_COMBINED' }),
      node('feGaussianBlur', { in: 'RGB_COMBINED', stdDeviation: '.3', result: 'ABERRATED_BLURRED' }),
      node('feComposite', { in: 'ABERRATED_BLURRED', in2: 'EDGE_MASK', operator: 'in', result: 'EDGE_ABERRATION' })
    );
    const inverse = node('feComponentTransfer', { in: 'EDGE_MASK', result: 'INVERTED_MASK' });
    inverse.append(node('feFuncA', { type: 'table', tableValues: '1 0' }));
    filter.append(inverse,
      node('feComposite', { in: 'CENTER_ORIGINAL', in2: 'INVERTED_MASK', operator: 'in', result: 'CENTER_CLEAN' }),
      node('feComposite', { in: 'EDGE_ABERRATION', in2: 'CENTER_CLEAN', operator: 'over' })
    );
    defs.append(filter); svg.append(defs);
    return { svg, scales };
  }

  const surfaces = hosts.map((host, index) => {
    // Upstream demo: User Info = D100, blur .5 (20px), radius32, elasticity0.
    // Toolbar: button D64, blur .1 (7.2px), saturation130, no container wobble.
    const compact = host.dataset.liquidGlass !== 'panel';
    const displacement = compact ? 64 : 100;
    const id = `liquid-glass-${index}`;
    const { svg, scales } = createFilter(id, displacement);
    const shade = layer('liquid-shade');
    const contrast = layer('liquid-contrast');
    const warp = layer('liquid-warp');
    if (!nativeOnly) warp.style.filter = `url(#${id})`;
    const rimScreen = layer('liquid-rim liquid-rim-screen');
    const rimOverlay = layer('liquid-rim liquid-rim-overlay');
    host.prepend(svg, warp, shade, contrast);
    host.append(rimScreen, rimOverlay);
    host.classList.add('liquid-ready');

    // The original border-light formula. A whole-viewport mouse container keeps
    // short toolbars from making the highlight swing sharply in the vertical axis.
    // Only thin rims change; non-clickable containers never get a hover spotlight.
    let pointerFrame = 0;
    let pointer = null;
    const paintRims = () => {
      pointerFrame = 0;
      if (!pointer || reducedMotion.matches || reducedTransparency.matches || root.dataset.background === 'solid') return;
      const mx = (pointer.x / innerWidth - .5) * 100;
      const my = (pointer.y / innerHeight - .5) * 100;
      const angle = 135 + mx * 1.2;
      const stop1 = Math.max(10, 33 + my * .3);
      const stop2 = Math.min(90, 66 + my * .4);
      const gradient = (first, second) => `linear-gradient(${angle}deg,rgba(255,255,255,0) 0%,rgba(255,255,255,${first + Math.abs(mx) * .008}) ${stop1}%,rgba(255,255,255,${second + Math.abs(mx) * .012}) ${stop2}%,rgba(255,255,255,0) 100%)`;
      rimScreen.style.backgroundImage = gradient(.12, .4);
      rimOverlay.style.backgroundImage = gradient(.32, .6);
    };
    host.addEventListener('pointermove', event => {
      if (!finePointer.matches || reducedMotion.matches || root.dataset.background === 'solid') return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintRims);
    }, { passive: true });
    // Leave the light at its last angle, as upstream does: no snap-back flash.
    return { host, svg, scales, displacement, compact };
  });

  function syncTheme() {
    // Match the demo's normal User Info material. The site adds a light
    // neutral scrim for white type over the landscape wallpaper.
    const overLight = false;
    surfaces.forEach(({ host, scales, displacement, compact }) => {
      host.classList.toggle('liquid-over-light', overLight);
      host.style.setProperty('--liquid-blur', `${(overLight ? 12 : 4) + (compact ? .1 : .5) * 32}px`);
      scales.forEach((scale, channel) => scale.setAttribute('scale', String(-displacement * (overLight ? .5 : 1) * (1 + channel * .1))));
    });
  }
  if (window.ResizeObserver) {
    const byHost = new Map(surfaces.map(surface => [surface.host, surface]));
    const resize = new ResizeObserver(entries => entries.forEach(entry => {
      const surface = byHost.get(entry.target);
      const { width, height } = entry.contentRect;
      // Resize-only: SVG dimensions never change in response to scroll.
      surface.svg.setAttribute('width', String(Math.round(width)));
      surface.svg.setAttribute('height', String(Math.round(height)));
    }));
    surfaces.forEach(({ host }) => resize.observe(host));
  }
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  syncTheme();
})();
