/* Original Big Sur photographs, selected by local clock or a saved preview time.
 * Only the current and next photograph are loaded. The browser composites
 * the crossfade; this clock never reads layout or runs on scroll.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const base = new URL('../img/big-sur/', document.currentScript.src);
  const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  let savedTime;
  try { savedTime = localStorage.getItem('harry-wallpaper-time'); } catch { /* Automatic without storage. */ }
  root.dataset.wallpaperTime = validTime(savedTime) ? savedTime : 'auto';
  // Website clock times, not Apple's original solar-position metadata.
  const periods = [
    { minute: 0, frame: 1, name: 'night' },
    { minute: 300, frame: 2, name: 'dawn' },
    { minute: 360, frame: 3, name: 'sunrise' },
    { minute: 450, frame: 0, name: 'morning' },
    { minute: 600, frame: 4, name: 'day' },
    { minute: 990, frame: 5, name: 'late-afternoon' },
    { minute: 1080, frame: 6, name: 'sunset' },
    { minute: 1140, frame: 7, name: 'dusk' },
    { minute: 1200, frame: 1, name: 'night' },
  ];
  const photoURL = frame => new URL(`big-sur-${frame}.jpg`, base).href;
  const periodIndex = date => {
    const manual = root.dataset.wallpaperTime;
    const minute = validTime(manual) ? Number(manual.slice(0, 2)) * 60 + Number(manual.slice(3)) : date.getHours() * 60 + date.getMinutes();
    let index = 0;
    periods.forEach((period, i) => { if (minute >= period.minute) index = i; });
    return index;
  };
  const enabled = () => root.dataset.background !== 'solid';
  const images = new Map();
  function loadPhoto(frame) {
    if (images.has(frame)) return images.get(frame);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { if (images.get(frame) === promise) images.delete(frame); reject(new Error('Wallpaper image unavailable')); };
      image.src = photoURL(frame);
    });
    images.set(frame, promise);
    return promise;
  }
  const firstIndex = periodIndex(new Date());
  let activeFrame = enabled() ? periods[firstIndex].frame : null;
  let activeLayer = 'a';
  let request = 0;
  let timer;
  root.dataset.wallpaperPeriod = periods[firstIndex].name;
  root.dataset.wallpaperLayer = activeLayer;
  root.style.setProperty('--wallpaper-a-image', activeFrame === null ? 'none' : `url("${photoURL(activeFrame)}")`);

  async function updatePhoto() {
    const generation = ++request;
    if (!enabled() || document.hidden) return;
    const index = periodIndex(new Date());
    const period = periods[index];
    try {
      await loadPhoto(period.frame);
      if (generation !== request || !enabled() || document.hidden) return;
      if (activeFrame !== period.frame) {
        const nextLayer = activeFrame === null ? 'a' : activeLayer === 'a' ? 'b' : 'a';
        root.style.setProperty(`--wallpaper-${nextLayer}-image`, `url("${photoURL(period.frame)}")`);
        root.dataset.wallpaperLayer = nextLayer;
        activeLayer = nextLayer;
        activeFrame = period.frame;
      }
      root.dataset.wallpaperPeriod = period.name;
      // Cache only the next distinct photograph, after the current one loads.
      const next = root.dataset.wallpaperTime === 'auto' ? periods.slice(index + 1).concat(periods).find(item => item.frame !== period.frame) : null;
      for (const frame of images.keys()) {
        if (frame !== period.frame && frame !== next?.frame) images.delete(frame);
      }
      if (next) loadPhoto(next.frame).catch(() => {});
    } catch { /* Keep the previous photograph, or the dark readable fallback. */ }
  }
  function schedule() {
    clearTimeout(timer);
    if (!enabled() || document.hidden) { request++; return; }
    updatePhoto();
    // A minute-boundary clock also picks up clock/time-zone changes without
    // keeping a frame loop alive. Returning to the page updates immediately.
    if (root.dataset.wallpaperTime === 'auto') timer = setTimeout(schedule, 60000 - (Date.now() % 60000) + 50);
  }
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pageshow', schedule);
  new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['data-background', 'data-wallpaper-time'] });
  schedule();
})();
