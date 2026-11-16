/* Small, dependency-free interactions for Harry's al-folio site. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionTokens = getComputedStyle(root);
  const motionDuration = parseFloat(motionTokens.getPropertyValue('--motion-standard')) || 240;
  const motionEase = motionTokens.getPropertyValue('--motion-ease').trim() || 'cubic-bezier(.22,1,.36,1)';
  const motions = new Map();
  function stopMotion(element) {
    const motion = motions.get(element);
    if (motion) { motion.animation.onfinish = null; motion.animation.cancel(); }
    motions.delete(element);
  }
  function animate(element, frames, duration = motionDuration, complete = () => {}) {
    stopMotion(element);
    if (reducedMotion.matches || !element.animate) { complete(); return; }
    const animation = element.animate(frames, { duration, easing: motionEase });
    const finish = () => {
      if (motions.get(element)?.animation !== animation) return;
      stopMotion(element); complete();
    };
    motions.set(element, { animation, finish });
    animation.onfinish = finish;
  }
  // A changed system preference also settles animations already in progress.
  reducedMotion.addEventListener('change', event => {
    if (event.matches) [...motions.values()].forEach(motion => motion.finish());
  });
  const closingDialogs = new WeakSet();
  function openDialog(panel) {
    const wasOpen = panel.open;
    const style = wasOpen ? getComputedStyle(panel) : null;
    const from = style ? { opacity: style.opacity, transform: style.transform } : { opacity: 0, transform: 'translateY(-6px) scale(.98)' };
    stopMotion(panel);
    closingDialogs.delete(panel);
    if (!wasOpen) panel.showModal();
    animate(panel, [from, { opacity: 1, transform: 'none' }]);
  }
  function closeDialog(panel, immediate = false) {
    if (!panel?.open || (closingDialogs.has(panel) && !immediate)) return;
    if (immediate) { stopMotion(panel); closingDialogs.delete(panel); panel.close(); return; }
    const style = getComputedStyle(panel);
    const from = { opacity: style.opacity, transform: style.transform };
    closingDialogs.add(panel);
    animate(panel, [from, { opacity: 0, transform: 'translateY(-4px) scale(.985)' }], 140, () => {
      closingDialogs.delete(panel);
      panel.close();
    });
  }
  document.querySelectorAll('#search-dialog, #wallpaper-dialog').forEach(panel => {
    panel.addEventListener('cancel', event => { event.preventDefault(); closeDialog(panel); });
    panel.addEventListener('close', () => { if (!panel.open) { stopMotion(panel); closingDialogs.delete(panel); } });
  });
  // One surface follows the target. Measure the visible position before cancelling
  // so a second interaction can redirect an unfinished transition without jumping.
  function movingIndicator(container, className, selected, underline = false) {
    if (!container) return () => {};
    const indicator = document.createElement('span');
    indicator.className = className;
    indicator.setAttribute('aria-hidden', 'true');
    indicator.hidden = true;
    container.append(indicator);
    container.classList.add(underline ? 'motion-filter-ready' : 'motion-nav-ready');
    let target = selected();
    function move(next, animated = true) {
      target = next;
      if (!target || !container.getClientRects().length) { indicator.hidden = true; return; }
      const before = indicator.hidden ? null : indicator.getBoundingClientRect();
      stopMotion(indicator);
      const bounds = container.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      Object.assign(indicator.style, {
        left: `${rect.left - bounds.left}px`, top: `${(underline ? rect.bottom + 3 : rect.top) - bounds.top}px`,
        width: `${rect.width}px`, height: `${underline ? 2 : rect.height}px`,
      });
      indicator.hidden = false;
      const after = indicator.getBoundingClientRect();
      if (animated && before && after.width) animate(indicator, [
        { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scaleX(${before.width / after.width})` },
        { transform: 'none' },
      ]);
    }
    move(target, false);
    if ('ResizeObserver' in window) new ResizeObserver(() => move(target, false)).observe(container);
    return move;
  }
  const desktopNav = document.querySelector('.desktop-nav');
  const activeNav = () => desktopNav?.querySelector('.active');
  const moveNav = movingIndicator(desktopNav, 'motion-nav-indicator', activeNav);
  const restoreNav = () => moveNav(desktopNav?.querySelector('a:focus-visible') || activeNav());
  desktopNav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('pointerenter', () => { if (finePointer.matches) moveNav(link); });
    link.addEventListener('focus', () => moveNav(link));
  });
  desktopNav?.addEventListener('pointerleave', restoreNav);
  desktopNav?.addEventListener('focusout', () => queueMicrotask(restoreNav));
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const themeButton = document.querySelector('.theme-toggle');
  const backgroundButton = document.querySelector('.background-toggle');
  const wallpaperDialog = document.querySelector('#wallpaper-dialog');
  const wallpaperEnabled = document.querySelector('#wallpaper-enabled');
  const wallpaperAuto = document.querySelector('#wallpaper-auto');
  const wallpaperTime = document.querySelector('#wallpaper-time');
  const wallpaperSlider = document.querySelector('#wallpaper-time-slider');
  const formatTime = minute => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  const localTime = () => { const now = new Date(); return formatTime(now.getHours() * 60 + now.getMinutes()); };
  const currentWallpaperTime = () => root.dataset.wallpaperTime === 'auto' ? localTime() : root.dataset.wallpaperTime || localTime();
  function updateBackgroundUI() {
    const enabled = root.dataset.background !== 'solid';
    const automatic = !root.dataset.wallpaperTime || root.dataset.wallpaperTime === 'auto';
    const time = currentWallpaperTime();
    backgroundButton?.classList.toggle('is-enabled', enabled);
    backgroundButton?.classList.toggle('is-previewing', enabled && !automatic);
    backgroundButton?.setAttribute('title', automatic ? 'Wallpaper and time · Automatic' : `Wallpaper and time · ${time}`);
    if (!wallpaperDialog) return;
    wallpaperEnabled.checked = enabled;
    wallpaperAuto.checked = automatic;
    document.querySelector('#wallpaper-time-controls').disabled = !enabled;
    wallpaperTime.value = time;
    wallpaperSlider.value = String(Number(time.slice(0, 2)) * 60 + Number(time.slice(3)));
    wallpaperSlider.setAttribute('aria-valuetext', time);
    document.querySelectorAll('[data-wallpaper-preset]').forEach(button => button.setAttribute('aria-pressed', String(!automatic && button.dataset.wallpaperPreset === time)));
    wallpaperDialog.dispatchEvent(new Event('wallpaper-controls-sync'));
  }
  function setBackground(enabled) {
    root.dataset.background = enabled ? 'wallpaper' : 'solid';
    try { localStorage.setItem('harry-background', root.dataset.background); } catch { /* Works without storage. */ }
    updateBackgroundUI();
  }
  function setWallpaperTime(time) {
    if (time !== 'auto' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { updateBackgroundUI(); return; }
    root.dataset.wallpaperTime = time;
    try { localStorage.setItem('harry-wallpaper-time', time); } catch { /* Preview still works. */ }
    updateBackgroundUI();
  }
  function closeWallpaper() {
    closeDialog(wallpaperDialog);
  }
  updateBackgroundUI();
  new MutationObserver(updateBackgroundUI).observe(root, { attributes:true, attributeFilter:['data-background', 'data-wallpaper-time', 'data-wallpaper-period'] });
  backgroundButton?.addEventListener('click', () => {
    if (!wallpaperDialog) return;
    closeDialog(document.querySelector('#search-dialog'), true);
    closeMenu();
    updateBackgroundUI();
    openDialog(wallpaperDialog);
    document.body.classList.add('wallpaper-settings-open');
  });
  wallpaperEnabled?.addEventListener('change', () => setBackground(wallpaperEnabled.checked));
  wallpaperAuto?.addEventListener('change', () => setWallpaperTime(wallpaperAuto.checked ? 'auto' : currentWallpaperTime()));
  wallpaperTime?.addEventListener('change', () => setWallpaperTime(wallpaperTime.value));
  wallpaperSlider?.addEventListener('input', () => setWallpaperTime(formatTime(Number(wallpaperSlider.value))));
  document.querySelectorAll('[data-wallpaper-preset]').forEach(button => button.addEventListener('click', () => setWallpaperTime(button.dataset.wallpaperPreset)));
  document.querySelector('.wallpaper-close')?.addEventListener('click', closeWallpaper);
  wallpaperDialog?.addEventListener('close', () => { if (!wallpaperDialog.open) document.body.classList.remove('wallpaper-settings-open'); });
  wallpaperDialog?.addEventListener('click', event => {
    if (event.target !== wallpaperDialog) return;
    const rect = wallpaperDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeWallpaper();
  });
  const syncVisibility = () => { root.dataset.pageVisible = String(!document.hidden); };
  syncVisibility();
  document.addEventListener('visibilitychange', syncVisibility);
  function currentTheme() { return root.dataset.theme || (colorScheme.matches ? 'dark' : 'light'); }
  function updateThemeUI() {
    const dark = currentTheme() === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    themeButton?.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeButton?.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191c21' : '#fafbfc');
  }
  updateThemeUI();
  themeButton?.addEventListener('click', () => {
    root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('harry-theme', root.dataset.theme); } catch { /* Still works in memory. */ }
    updateThemeUI();
  });
  colorScheme.addEventListener('change', () => {
    let saved;
    try { saved = localStorage.getItem('harry-theme'); } catch { /* No stored override. */ }
    if (saved !== 'light' && saved !== 'dark') { root.dataset.theme = colorScheme.matches ? 'dark' : 'light'; updateThemeUI(); }
  });
  const menu = document.querySelector('#mobile-nav');
  const menuButton = document.querySelector('.menu-toggle');
  let menuOpen = false;
  function setMenu(open, immediate = false) {
    if (!menu || (menuOpen === open && !immediate)) return;
    const height = menu.hidden ? 0 : menu.getBoundingClientRect().height;
    const opacity = menu.hidden ? 0 : getComputedStyle(menu).opacity;
    const padding = menu.hidden ? '0px' : getComputedStyle(menu).paddingBottom;
    stopMotion(menu);
    menuOpen = open;
    menu.hidden = false;
    menu.inert = !open;
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (!open && menu.contains(document.activeElement)) menuButton?.focus();
    const finish = () => { menu.hidden = !open; menu.style.overflow = ''; };
    if (immediate) { finish(); return; }
    const fullHeight = menu.getBoundingClientRect().height;
    const fullPadding = getComputedStyle(menu).paddingBottom;
    menu.style.overflow = 'hidden';
    animate(menu, [
      { height: `${height}px`, opacity, paddingBottom: padding },
      { height: `${open ? fullHeight : 0}px`, opacity: open ? 1 : 0, paddingBottom: open ? fullPadding : '0px' },
    ], open ? motionDuration : 140, finish);
  }
  function closeMenu() { setMenu(false); }
  menuButton?.addEventListener('click', () => setMenu(!menuOpen));
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (!event.target.closest('.header-wrap')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu && !menu.hidden) { closeMenu(); menuButton?.focus(); }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false, true); });
  const dialog = document.querySelector('#search-dialog');
  const searchInput = document.querySelector('#site-search');
  const resultContainer = document.querySelector('#search-results');
  const searchSummary = document.querySelector('#search-summary');
  const normalizeSearch = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[-–—_]/g, ' ');
  let searchItems = [];
  try {
    searchItems = JSON.parse(document.querySelector('#search-data')?.textContent || '[]').map(item => ({
      ...item,
      fields: [item.title, item.description, item.keywords, item.text].map(normalizeSearch),
    }));
  } catch { /* Keep other controls working. */ }
  function renderSearch() {
    const query = normalizeSearch(searchInput.value).trim();
    const tokens = query.split(/\s+/).filter(Boolean);
    const ranked = searchItems.filter(item => tokens.every(token => item.fields.some(field => field.includes(token))));
    const score = item => tokens.reduce((sum, token) => sum + item.fields.reduce((weight, field, index) => weight + (field.includes(token) ? [8, 4, 2, 1][index] : 0), 0), item.fields[0].includes(query) ? 10 : 0);
    if (tokens.length) ranked.sort((a, b) => score(b) - score(a));
    const matches = ranked.slice(0, 12);
    if (searchSummary) searchSummary.textContent = tokens.length
      ? ranked.length > matches.length ? `Showing ${matches.length} of ${ranked.length} results` : `${ranked.length} ${ranked.length === 1 ? 'result' : 'results'}`
      : 'Search projects, pages, and posts';
    resultContainer.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className = 'search-empty';
      empty.textContent = 'No results. Try “robot”, “vision”, or “hand”.'; resultContainer.append(empty); return;
    }
    matches.forEach(item => {
      const link = document.createElement('a'); link.className = 'search-result'; link.href = item.url;
      const type = document.createElement('span'); type.className = 'result-type'; type.textContent = item.type;
      const copy = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = item.title;
      const description = document.createElement('p'); description.textContent = item.description;
      copy.append(title, description); link.append(type, copy); resultContainer.append(link);
    });
  }
  function openSearch() {
    if (!dialog || (dialog.open && !closingDialogs.has(dialog))) return;
    closeMenu(); closeDialog(wallpaperDialog, true); searchInput.value = ''; renderSearch(); openDialog(dialog); document.body.classList.add('search-open'); searchInput.focus();
  }
  document.querySelectorAll('.search-trigger').forEach(button => button.addEventListener('click', openSearch));
  document.querySelector('.search-close')?.addEventListener('click', () => closeDialog(dialog));
  dialog?.addEventListener('close', () => { if (!dialog.open) document.body.classList.remove('search-open'); });
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    }
  });
  searchInput?.addEventListener('input', renderSearch);
  searchInput?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(dialog); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); resultContainer.querySelector('a')?.focus(); }
    if (event.key === 'Enter') resultContainer.querySelector('a')?.click();
  });
  resultContainer?.addEventListener('keydown', event => {
    const links = [...resultContainer.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && index >= 0) { event.preventDefault(); links[Math.min(index + 1, links.length - 1)]?.focus(); }
    if (event.key === 'ArrowUp' && index >= 0) { event.preventDefault(); if (index === 0) searchInput.focus(); else links[index - 1]?.focus(); }
  });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
  });
  const filterButtons = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  const explorer = document.querySelector('[data-project-explorer]');
  const projectQuery = document.querySelector('#project-search');
  const projectReset = document.querySelector('[data-project-reset]');
  const projectViews = document.querySelectorAll('[data-project-view]');
  const projectFields = new Map(searchItems.map(item => [item.url, item.fields.join(' ')]));
  const validAreas = ['all', 'robotics', 'software'];
  function projectParams() {
    const params = new URLSearchParams();
    const area = document.querySelector('[data-filter].active')?.dataset.filter || 'all';
    if (area !== 'all') params.set('area', area);
    const query = projectQuery?.value.trim().slice(0, 200);
    if (query) params.set('q', query);
    if (explorer?.dataset.view === 'list') params.set('view', 'list');
    return params;
  }
  function syncProjectLocation(mode) {
    if (!explorer) return;
    const params = projectParams();
    const url = new URL(location.href);
    ['area', 'q', 'view'].forEach(key => { if (params.has(key)) url.searchParams.set(key, params.get(key)); else url.searchParams.delete(key); });
    if (mode && url.href !== location.href) history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url);
    const query = params.toString();
    explorer.querySelectorAll('[data-project-link]').forEach(link => {
      link.href = link.closest('[data-project-url]').dataset.projectUrl + (query ? `?${query}` : '');
    });
  }
  const moveFilter = movingIndicator(document.querySelector('.filter-bar'), 'motion-filter-indicator', () => document.querySelector('[data-filter].active'), true);
  function filterCards(button, { motion = true, historyMode = null } = {}) {
    if (!button) return;
    const before = new Map();
    if (motion) cards.forEach(card => { if (!card.hidden) before.set(card, { rect: card.getBoundingClientRect(), opacity: getComputedStyle(card).opacity }); });
    cards.forEach(stopMotion);
    filterButtons.forEach(item => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); });
    moveFilter(button);
    let visible = 0;
    const tokens = normalizeSearch(projectQuery?.value).trim().split(/\s+/).filter(Boolean);
    cards.forEach(card => {
      const areaMatches = button.dataset.filter === 'all' || (explorer
        ? card.dataset.projectArea === button.dataset.filter
        : card.dataset.category.split('|').includes(button.dataset.filter));
      const text = projectFields.get(card.dataset.projectUrl) || normalizeSearch(card.textContent);
      card.hidden = !areaMatches || (explorer && !tokens.every(token => text.includes(token)));
      if (!card.hidden) visible++;
    });
    if (motion && !reducedMotion.matches) cards.forEach(card => {
      if (card.hidden) return;
      const after = card.getBoundingClientRect();
      if (after.top > innerHeight || after.bottom < 0) return;
      const previous = before.get(card);
      const from = previous
        ? { transform: `translate(${previous.rect.left - after.left}px, ${previous.rect.top - after.top}px)`, opacity: previous.opacity }
        : { transform: 'translateY(6px)', opacity: 0 };
      animate(card, [from, { transform: 'none', opacity: 1 }]);
    });
    const status = document.querySelector('#filter-status');
    if (status) status.textContent = explorer ? `Showing ${visible} of ${cards.length} projects` : `Showing ${visible} ${visible === 1 ? 'item' : 'items'}`;
    if (explorer) {
      explorer.querySelector('.project-empty').hidden = visible !== 0;
      projectReset.hidden = button.dataset.filter === 'all' && !projectQuery.value;
      syncProjectLocation(historyMode);
    }
  }
  filterButtons.forEach(button => button.addEventListener('click', () => {
    if (!button.classList.contains('active')) filterCards(button, { historyMode: 'push' });
  }));
  if (explorer) {
    explorer.querySelector('.project-browser-controls').hidden = false;
    function setProjectView(view) {
      explorer.dataset.view = view === 'list' ? 'list' : 'cards';
      projectViews.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectView === explorer.dataset.view)));
    }
    function restoreProjectLocation() {
      const params = new URLSearchParams(location.search);
      const area = validAreas.includes(params.get('area')) ? params.get('area') : 'all';
      projectQuery.value = (params.get('q') || '').slice(0, 200);
      setProjectView(params.get('view'));
      filterCards(document.querySelector(`[data-filter="${area}"]`), { motion: false });
    }
    restoreProjectLocation();
    window.addEventListener('popstate', restoreProjectLocation);
    projectQuery.addEventListener('input', () => filterCards(document.querySelector('[data-filter].active'), { motion: false, historyMode: 'replace' }));
    projectReset.addEventListener('click', () => {
      projectQuery.value = '';
      filterCards(document.querySelector('[data-filter="all"]'), { historyMode: 'push' });
      projectQuery.focus();
    });
    projectViews.forEach(button => button.addEventListener('click', () => {
      cards.forEach(stopMotion);
      setProjectView(button.dataset.projectView);
      syncProjectLocation('push');
    }));
  }
  // A project opened from a filtered collection returns to that same collection.
  const returnParams = new URLSearchParams(location.search);
  document.querySelectorAll('[data-project-return], [data-project-continue]').forEach(link => {
    const url = new URL(link.href);
    if (validAreas.includes(returnParams.get('area')) && returnParams.get('area') !== 'all') url.searchParams.set('area', returnParams.get('area'));
    if (returnParams.get('q')) url.searchParams.set('q', returnParams.get('q').slice(0, 200));
    if (returnParams.get('view') === 'list') url.searchParams.set('view', 'list');
    link.href = url.href;
  });
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const label = button.querySelector('span'); const status = document.querySelector('#copy-status');
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        if (label) label.textContent = 'Copied ✓'; if (status) status.textContent = 'Email address copied';
        setTimeout(() => { if (label) label.textContent = 'Copy email'; }, 2400);
      } catch {
        if (label) label.textContent = button.dataset.copy;
        if (status) { status.classList.remove('sr-only'); status.textContent = `Copy this email address: ${button.dataset.copy}`; }
      }
    });
  });
  document.querySelector('.print-cv')?.addEventListener('click', () => window.print());
})();
