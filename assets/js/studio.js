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
  const wallpaperMotion = document.querySelector('#wallpaper-motion');
  const motionHint = document.querySelector('#wallpaper-motion-hint');
  const staticScenery = window.matchMedia('(prefers-reduced-motion: reduce), (prefers-contrast: more), (forced-colors: active), (prefers-reduced-transparency: reduce)');
  let sceneryRequested = root.dataset.wallpaperMotion !== 'off';
  const wallpaperAuto = document.querySelector('#wallpaper-auto');
  const wallpaperTime = document.querySelector('#wallpaper-time');
  const wallpaperSlider = document.querySelector('#wallpaper-time-slider');
  const formatTime = minute => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  const localTime = () => { const now = new Date(); return formatTime(now.getHours() * 60 + now.getMinutes()); };
  const currentWallpaperTime = () => root.dataset.wallpaperTime === 'auto' ? localTime() : root.dataset.wallpaperTime || localTime();
  function syncScenery() {
    const hidden = root.dataset.background === 'solid';
    const available = !hidden && !staticScenery.matches;
    const active = available && sceneryRequested;
    root.dataset.wallpaperMotion = active ? 'on' : 'off';
    if (!wallpaperMotion || !motionHint) return;
    wallpaperMotion.checked = active;
    wallpaperMotion.disabled = !available;
    motionHint.hidden = available;
    motionHint.textContent = available ? '' : hidden
      ? 'Turn on the wallpaper to animate its light.'
      : 'Your display preferences keep the light still.';
  }
  function updateBackgroundUI() {
    const enabled = root.dataset.background !== 'solid';
    const automatic = !root.dataset.wallpaperTime || root.dataset.wallpaperTime === 'auto';
    const time = currentWallpaperTime();
    backgroundButton?.classList.toggle('is-enabled', enabled);
    backgroundButton?.classList.toggle('is-previewing', enabled && !automatic);
    backgroundButton?.setAttribute('title', automatic ? 'Wallpaper and time · Automatic' : `Wallpaper and time · ${time}`);
    if (!wallpaperDialog) return;
    wallpaperEnabled.checked = enabled;
    syncScenery();
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
  wallpaperMotion?.addEventListener('change', () => {
    sceneryRequested = wallpaperMotion.checked;
    try { localStorage.setItem('harry-wallpaper-motion', sceneryRequested ? 'on' : 'off'); } catch { /* Local choice still applies. */ }
    syncScenery();
  });
  staticScenery.addEventListener('change', syncScenery);
  window.addEventListener('storage', event => {
    if (event.key !== 'harry-wallpaper-motion' && event.key !== null) return;
    sceneryRequested = event.newValue !== 'off';
    syncScenery();
  });
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
  function syncVisibility() {
    root.dataset.pageVisible = String(!document.hidden);
  }
  syncVisibility();
  document.addEventListener('visibilitychange', syncVisibility);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    // A cached document may have missed preference changes on the next page.
    try { sceneryRequested = localStorage.getItem('harry-wallpaper-motion') !== 'off'; } catch { /* Keep the local choice. */ }
    syncScenery();
    syncVisibility();
  });
  function currentTheme() { return root.dataset.theme || (colorScheme.matches ? 'dark' : 'light'); }
  function updateThemeUI() {
    const dark = currentTheme() === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    themeButton?.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeButton?.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191c21' : '#fafbfc');
  }
  updateThemeUI();
  function applyTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('harry-theme', theme); } catch { /* Still works in memory. */ }
    updateThemeUI();
  }
  // The new palette expands from the toggle. Without View Transitions or with reduced
  // motion, the theme changes at once.
  themeButton?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (reducedMotion.matches || document.hidden || typeof document.startViewTransition !== 'function') { applyTheme(next); return; }
    const bounds = themeButton.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theme-transition');
    let transition;
    try { transition = document.startViewTransition(() => applyTheme(next)); } catch { root.classList.remove('theme-transition'); applyTheme(next); return; }
    transition.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 560, easing: motionEase, pseudoElement: '::view-transition-new(root)' },
    )).catch(() => {});
    transition.finished.finally(() => root.classList.remove('theme-transition'));
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
      fields: [item.title, item.aliases, item.description, item.keywords, item.text].map(normalizeSearch),
    }));
  } catch { /* Keep other controls working. */ }
  const scopeButtons = [...document.querySelectorAll('[data-search-type]')];
  const navigationURLs = [...document.querySelectorAll('.desktop-nav a')].map(link => link.pathname);
  const quickLinks = navigationURLs.map(url => searchItems.find(item => item.url === url)).filter(Boolean);
  let searchType = 'all';
  // Commands share the result list. Each one either follows a link or runs a page action.
  const commandData = dialog?.dataset || {};
  const announce = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
  const pageAddress = document.querySelector('link[rel="canonical"]')?.href || location.href;
  const commands = [
    { title: 'Copy email address', detail: commandData.email, keywords: 'email mail contact copy address', available: Boolean(commandData.email),
      run: () => announce('site:copy', { text: commandData.email, message: 'Email address copied' }) },
    { title: 'Copy link to this page', detail: new URL(pageAddress).pathname, keywords: 'copy link url share address page permalink', available: true,
      run: () => announce('site:copy', { text: pageAddress, message: 'Page link copied' }) },
    { title: 'Download CV (PDF)', detail: 'yu-han-cv.pdf', keywords: 'cv resume résumé curriculum vitae pdf download', href: commandData.cv, download: true },
    { title: () => currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', detail: finePointer.matches ? 'Shortcut: T' : 'Light or dark appearance', keywords: 'theme dark light mode appearance colour color', available: Boolean(themeButton),
      run: () => themeButton.click() },
    { title: () => root.dataset.background === 'solid' ? 'Show the Big Sur wallpaper' : 'Use a solid background', detail: 'Wallpaper and time settings', keywords: 'wallpaper background scenery solid big sur photo', available: Boolean(wallpaperDialog),
      run: () => setBackground(root.dataset.background === 'solid') },
    { title: 'Open GitHub profile', detail: (commandData.github || '').replace(/^https?:\/\//, ''), keywords: 'github code repositories source', href: commandData.github, external: true },
    { title: 'Subscribe via RSS', detail: 'rss.xml', keywords: 'rss atom feed subscribe', href: commandData.rss },
    { title: 'Show keyboard shortcuts', detail: 'Shortcut: ?', keywords: 'keyboard shortcuts keys hotkeys help', available: finePointer.matches && Boolean(document.querySelector('#shortcuts-dialog')),
      run: () => announce('site:shortcuts') },
  ].filter(command => command.run ? command.available : Boolean(command.href));
  const commandTitle = command => typeof command.title === 'function' ? command.title() : command.title;
  function matchingCommands(tokens) {
    if (searchType !== 'all') return [];
    if (!tokens.length) return commands;
    return commands.filter(command => {
      const text = normalizeSearch(`${commandTitle(command)} ${command.keywords} ${command.detail || ''}`);
      return tokens.every(token => text.includes(token));
    });
  }
  function commandElement(command) {
    const element = document.createElement(command.href ? 'a' : 'button');
    element.className = 'search-result';
    element.dataset.kind = 'action';
    if (command.href) {
      element.href = command.href;
      if (command.download) element.setAttribute('download', '');
      if (command.external) { element.target = '_blank'; element.rel = 'noopener noreferrer'; }
    } else {
      element.type = 'button';
    }
    const type = document.createElement('span');
    type.className = 'result-type';
    type.textContent = 'Action';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = commandTitle(command);
    copy.append(title);
    if (command.detail) {
      const detail = document.createElement('p');
      detail.textContent = command.detail;
      copy.append(detail);
    }
    element.append(type, copy);
    element.addEventListener('click', event => {
      closeDialog(dialog, true);
      if (!command.run) return;
      event.preventDefault();
      requestAnimationFrame(() => command.run());
    });
    return element;
  }

  function setScope(type) {
    searchType = type;
    scopeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.searchType === type)));
  }

  function renderSearch() {
    const query = normalizeSearch(searchInput.value).trim();
    const tokens = query.split(/\s+/).filter(Boolean);
    const quick = !tokens.length && searchType === 'all';
    const candidates = quick ? quickLinks : searchItems.filter(item => searchType === 'all' || item.type === searchType);
    const matches = candidates.filter(item => tokens.every(token => item.fields.some(field => field.includes(token))));
    const actions = matchingCommands(tokens);
    if (tokens.length) {
      const weights = [10, 8, 4, 2, 1];
      const score = item => tokens.reduce((sum, token) => sum + item.fields.reduce(
        (weight, field, index) => weight + (field.includes(token) ? weights[index] : 0), 0
      ), item.fields[0].includes(query) ? 10 : 0);
      matches.sort((a, b) => score(b) - score(a));
    }
    const total = matches.length + actions.length;
    searchSummary.textContent = quick ? 'Quick links and commands' : total + (total === 1 ? ' result' : ' results');
    resultContainer.replaceChildren();
    resultContainer.scrollTop = 0;
    if (!total) {
      const empty = document.createElement('div');
      empty.className = 'search-empty';
      empty.textContent = query ? 'No results for “' + searchInput.value.trim() + '”.' : 'No results in this section.';
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.textContent = searchType === 'all' ? 'Clear search' : 'Search all sections';
      reset.addEventListener('click', () => {
        if (searchType === 'all') searchInput.value = '';
        setScope('all');
        renderSearch();
        searchInput.focus();
      });
      empty.append(reset);
      resultContainer.append(empty);
      return;
    }
    // A command named by the query leads; other matching commands follow the content.
    const leading = tokens.length ? actions.filter(command => normalizeSearch(commandTitle(command)).includes(query)) : [];
    leading.forEach(command => resultContainer.append(commandElement(command)));
    for (const item of matches) {
      const link = document.createElement('a');
      link.className = 'search-result';
      link.href = item.url;
      const type = document.createElement('span');
      type.className = 'result-type';
      type.textContent = item.type === 'Post' ? 'Writing' : item.type;
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const description = document.createElement('p');
      description.textContent = item.description;
      copy.append(title, description);
      link.append(type, copy);
      resultContainer.append(link);
    }
    const trailing = actions.filter(command => !leading.includes(command));
    if (quick && trailing.length) {
      const group = document.createElement('p');
      group.className = 'search-group';
      group.setAttribute('aria-hidden', 'true');
      group.textContent = 'Commands';
      resultContainer.append(group);
    }
    trailing.forEach(command => resultContainer.append(commandElement(command)));
  }

  scopeButtons.forEach(button => button.addEventListener('click', () => {
    setScope(button.dataset.searchType);
    renderSearch();
  }));

  // A section match on this document must release the modal's focus trap.
  resultContainer?.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.pathname !== location.pathname || link.search !== location.search) return;
    closeDialog(dialog, true);
    if (!link.hash) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (target) requestAnimationFrame(() => {
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({ preventScroll: true });
    });
  });

  function openSearch() {
    if (!dialog || (dialog.open && !closingDialogs.has(dialog))) return;
    const other = document.querySelector('dialog[open]');
    if (other && other !== dialog && other !== wallpaperDialog) other.close();
    closeMenu(); closeDialog(wallpaperDialog, true); searchInput.value = ''; setScope('all'); renderSearch(); openDialog(dialog); document.body.classList.add('search-open'); searchInput.focus();
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
    if (event.key === 'ArrowDown') { event.preventDefault(); resultContainer.querySelector('.search-result')?.focus(); }
    if (event.key === 'Enter') resultContainer.querySelector('.search-result')?.click();
  });
  resultContainer?.addEventListener('keydown', event => {
    const links = [...resultContainer.querySelectorAll('.search-result')];
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
  const writingArchive = document.querySelector('.writing-archive');
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
    const compare = url.searchParams.get('compare');
    if (compare && explorer.querySelector('#compare-projects[open]')) params.set('compare', compare);
    const query = params.toString();
    explorer.querySelectorAll('[data-project-link]').forEach(link => {
      link.href = link.closest('[data-project-url]').dataset.projectUrl + (query ? `?${query}` : '');
    });
  }
  function syncWritingLocation(category, mode) {
    const updateCategory = url => {
      if (category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', category);
      return url;
    };
    const url = updateCategory(new URL(location.href));
    if (mode && url.href !== location.href) history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url);
    writingArchive.querySelectorAll('[data-post-link]').forEach(link => {
      link.href = updateCategory(new URL(link.href)).href;
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
    } else if (writingArchive) {
      syncWritingLocation(button.dataset.filter, historyMode);
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
    explorer.addEventListener('projectcomparisonchange', () => syncProjectLocation());
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
  } else if (writingArchive) {
    function restoreWritingLocation() {
      const category = new URLSearchParams(location.search).get('category');
      const button = [...filterButtons].find(item => item.dataset.filter === category);
      filterCards(button || writingArchive.querySelector('[data-filter="all"]'), { motion: false, historyMode: 'replace' });
    }
    restoreWritingLocation();
    window.addEventListener('popstate', restoreWritingLocation);
  }
  // A project opened from a filtered collection returns to that same collection.
  const returnParams = new URLSearchParams(location.search);
  const compare = returnParams.get('compare');
  const validPair = compare && /^[a-z0-9-]+,[a-z0-9-]+$/.test(compare) && new Set(compare.split(',')).size === 2;
  document.querySelectorAll('[data-project-return], [data-project-continue]').forEach(link => {
    const url = new URL(link.href);
    if (validAreas.includes(returnParams.get('area')) && returnParams.get('area') !== 'all') url.searchParams.set('area', returnParams.get('area'));
    if (returnParams.get('q')) url.searchParams.set('q', returnParams.get('q').slice(0, 200));
    if (returnParams.get('view') === 'list') url.searchParams.set('view', 'list');
    // Explicit pair links keep their own comparison. Ordinary case links carry the reader's pair.
    if (validPair && !url.searchParams.has('compare')) {
      url.searchParams.set('compare', compare);
      if (link.hasAttribute('data-project-return')) url.hash = 'compare-projects';
    }
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
