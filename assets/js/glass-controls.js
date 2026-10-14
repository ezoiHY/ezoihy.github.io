/*
 * Compact optical controls using liquid-glass-web's overlay-copy pattern.
 * createGlass/createSpring are from the unchanged MIT engine; see UPSTREAM.md.
 * Native links and inputs keep all interaction. Only decorative copies bend.
 * No wallpaper copies, scroll handlers, or animation while controls are idle.
 */
import { createGlass, createSpring } from '../vendor/gentpan-liquidglass.js';

const reduceTransparency = matchMedia('(prefers-reduced-transparency: reduce)');
const moreContrast = matchMedia('(prefers-contrast: more)');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const allowsOptics = () => !reduceTransparency.matches && !moreContrast.matches && !document.hidden;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const decoration = className => {
  const el = document.createElement('span');
  el.className = className;
  el.setAttribute('aria-hidden', 'true');
  return el;
};
const place = (el, x, y, w, h) => Object.assign(el.style, {
  width: `${w}px`, height: `${h}px`, borderRadius: `${h / 2}px`,
  transform: `translate(${x}px, ${y}px)`,
});
const controllers = [];

function navigation(nav) {
  const links = [...nav.querySelectorAll('a')];
  const current = links.find(link => link.getAttribute('aria-current') === 'page');
  if (!current) return;
  const copy = decoration('glass-nav-copy');
  const shadow = decoration('glass-nav-shadow');
  links.forEach(link => {
    const label = document.createElement('span');
    label.textContent = link.textContent;
    copy.append(label);
  });
  nav.append(copy, shadow);
  let glass, selected = current, x = 0, widths = [], height = 0, top = 0;
  let active = false;
  const spring = createSpring(0, (value, velocity) => {
    x = value;
    if (!active || !glass) return;
    const stretch = Math.min(6, Math.abs(velocity) * .015);
    let i = 0;
    while (i < widths.length - 2 && x > widths[i + 1].left) i++;
    const a = widths[i], b = widths[Math.min(i + 1, widths.length - 1)];
    const mix = clamp((x - a.left) / (b.left - a.left || 1));
    const w = a.width + (b.width - a.width) * mix + stretch;
    const h = height - stretch * .15;
    const left = x - stretch / 2, y = top + (height - h) / 2;
    glass.update({ x: left, y, width: w, height: h, radius: h / 2 });
    place(shadow, left, y, w, h);
  }, { stiffness: 420, damping: 34 });

  function refresh() {
    const visible = nav.offsetWidth > 0 && allowsOptics();
    if (!visible) {
      active = false; spring.stop(); glass?.destroy(); glass = null;
      nav.classList.remove('glass-nav-ready');
      return;
    }
    widths = links.map(link => ({ left: link.offsetLeft, width: link.offsetWidth }));
    height = current.offsetHeight; top = current.offsetTop;
    if (!glass) glass = createGlass(copy, {
      clip: true, refraction: 5, bezel: .35, curvature: 4,
      chroma: 0, blur: 0, specular: .65, specularWidth: 1.5, mapScale: 1,
    });
    active = true;
    nav.classList.add('glass-nav-ready');
    spring.set(selected.offsetLeft, { immediate: true });
  }
  function move(link) {
    if (!active || selected === link) return;
    selected = link;
    spring.set(link.offsetLeft);
  }
  links.forEach(link => {
    link.addEventListener('pointerenter', () => move(link));
    link.addEventListener('focus', () => move(link));
  });
  nav.addEventListener('pointerleave', () => {
    move(links.includes(document.activeElement) ? document.activeElement : current);
  });
  nav.addEventListener('focusout', event => {
    if (!nav.contains(event.relatedTarget)) move(current);
  });
  const resize = new ResizeObserver(refresh);
  resize.observe(nav);
  controllers.push({ refresh });
  refresh();
}

function inputControl(input, range, dialog) {
  const wrapper = document.createElement('span');
  wrapper.className = range ? 'glass-input glass-range' : 'glass-input glass-switch';
  const track = decoration('glass-input-track');
  const copy = decoration('glass-input-copy');
  copy.append(decoration('glass-input-track'));
  const thumb = decoration('glass-input-thumb');
  const shadow = decoration('glass-input-shadow');
  input.before(wrapper);
  wrapper.append(input, track, copy, shadow, thumb);
  const bleed = 12;
  const fraction = () => range ? clamp((input.valueAsNumber - Number(input.min)) /
    (Number(input.max) - Number(input.min) || 1)) : Number(input.checked);
  let value = fraction(), velocity = 0, press = 0, glass, width = range ? 0 : 52;
  const position = createSpring(value, (v, speed) => {
    value = clamp(v); velocity = speed; render();
  }, { stiffness: range ? 900 : 440, damping: range ? 50 : 32 });
  const pressure = createSpring(0, v => { press = clamp(v); render(); }, { stiffness: 600, damping: 36 });

  function render() {
    const p = allowsOptics() && dialog.open && !reduceMotion.matches ? press : 0;
    const stretch = p * Math.min(5, Math.abs(velocity));
    const w = (range ? 28 : 24) + p * 12 + stretch;
    const h = (range ? 22 : 24) + p * 6 - stretch * .15;
    const center = range ? 14 + value * (width - 28) : 14 + value * 24;
    const left = center - w / 2, top = (range ? 18 : 14) - h / 2;
    wrapper.style.setProperty('--switch-value', value.toFixed(4));
    place(thumb, left, top, w, h); place(shadow, left, top, w, h);
    thumb.style.opacity = String(1 - p);
    shadow.style.opacity = String(p);
    copy.style.opacity = String(p);
    if (p > .01 && width > 0) {
      if (!glass) glass = createGlass(copy, {
        clip: true, refraction: range ? 6 : 8, bezel: .9, curvature: 3,
        chroma: .12, specular: .7, specularWidth: 1.5, mapScale: 1,
      });
      glass.update({ x: left + bleed, y: top + bleed, width: w, height: h, radius: h / 2 });
    } else {
      glass?.destroy(); glass = null;
    }
  }
  function sync() {
    const next = fraction();
    if (next !== position.target) position.set(next, { immediate: !dialog.open || !allowsOptics() });
    if (!dialog.open || !allowsOptics()) {
      pressure.set(0, { immediate: true });
      position.set(next, { immediate: true });
    }
    render();
  }
  input.addEventListener('pointerdown', () => {
    if (!input.matches(':disabled') && allowsOptics() && !reduceMotion.matches) pressure.set(1);
  });
  for (const event of ['pointerup', 'pointercancel', 'pointerleave', 'blur']) {
    input.addEventListener(event, () => pressure.set(0));
  }
  input.addEventListener('keydown', event => {
    if (!event.repeat && [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && allowsOptics() && !reduceMotion.matches) pressure.set(1);
  });
  input.addEventListener('keyup', () => pressure.set(0));
  input.addEventListener(range ? 'input' : 'change', sync);
  if (range) {
    const resize = new ResizeObserver(() => { width = wrapper.clientWidth; render(); });
    resize.observe(wrapper);
  }
  controllers.push({ refresh: sync });
  render();
  return sync;
}

const nav = document.querySelector('.desktop-nav');
if (nav) navigation(nav);
const dialog = document.querySelector('#wallpaper-dialog');
if (dialog) {
  const sync = [...dialog.querySelectorAll('.toggle-switch, .wallpaper-time-slider')]
    .map(input => inputControl(input, input.type === 'range', dialog));
  const refresh = () => sync.forEach(update => update());
  dialog.addEventListener('wallpaper-controls-sync', refresh);
  dialog.addEventListener('close', refresh);
  new MutationObserver(refresh).observe(dialog, { attributes: true, attributeFilter: ['open'] });
}
const refreshAll = () => controllers.forEach(controller => controller.refresh());
reduceTransparency.addEventListener('change', refreshAll);
moreContrast.addEventListener('change', refreshAll);
reduceMotion.addEventListener('change', refreshAll);
document.addEventListener('visibilitychange', refreshAll);
window.addEventListener('pageshow', refreshAll);
