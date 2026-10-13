/* Small, dependency-free interactions for Harry's al-folio site. */
(() => {
  'use strict';
  const root = document.documentElement;
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
    if (wallpaperDialog?.open) wallpaperDialog.close();
  }
  updateBackgroundUI();
  new MutationObserver(updateBackgroundUI).observe(root, { attributes:true, attributeFilter:['data-background', 'data-wallpaper-time', 'data-wallpaper-period'] });
  backgroundButton?.addEventListener('click', () => {
    if (!wallpaperDialog) return;
    document.querySelector('#search-dialog')?.close();
    closeMenu();
    updateBackgroundUI();
    wallpaperDialog.showModal();
    document.body.classList.add('wallpaper-settings-open');
  });
  wallpaperEnabled?.addEventListener('change', () => setBackground(wallpaperEnabled.checked));
  wallpaperAuto?.addEventListener('change', () => setWallpaperTime(wallpaperAuto.checked ? 'auto' : currentWallpaperTime()));
  wallpaperTime?.addEventListener('change', () => setWallpaperTime(wallpaperTime.value));
  wallpaperSlider?.addEventListener('input', () => setWallpaperTime(formatTime(Number(wallpaperSlider.value))));
  document.querySelectorAll('[data-wallpaper-preset]').forEach(button => button.addEventListener('click', () => setWallpaperTime(button.dataset.wallpaperPreset)));
  document.querySelector('.wallpaper-close')?.addEventListener('click', closeWallpaper);
  wallpaperDialog?.addEventListener('close', () => document.body.classList.remove('wallpaper-settings-open'));
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
  function closeMenu() {
    if (!menu) return;
    menu.hidden = true;
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation');
  }
  menuButton?.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    menuButton.setAttribute('aria-expanded', String(!menu.hidden));
    menuButton.setAttribute('aria-label', menu.hidden ? 'Open navigation' : 'Close navigation');
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (!event.target.closest('.header-wrap')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu && !menu.hidden) { closeMenu(); menuButton?.focus(); }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  const dialog = document.querySelector('#search-dialog');
  const searchInput = document.querySelector('#site-search');
  const resultContainer = document.querySelector('#search-results');
  let searchItems = [];
  try { searchItems = JSON.parse(document.querySelector('#search-data')?.textContent || '[]'); } catch { /* Keep other controls working. */ }
  function renderSearch() {
    const tokens = searchInput.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const matches = searchItems.filter(item => tokens.every(token => `${item.title} ${item.description}`.toLocaleLowerCase().includes(token))).slice(0, 12);
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
    if (!dialog || dialog.open) return;
    closeMenu(); closeWallpaper(); searchInput.value = ''; renderSearch(); dialog.showModal(); document.body.classList.add('search-open'); searchInput.focus();
  }
  document.querySelectorAll('.search-trigger').forEach(button => button.addEventListener('click', openSearch));
  document.querySelector('.search-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('close', () => document.body.classList.remove('search-open'));
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  searchInput?.addEventListener('input', renderSearch);
  searchInput?.addEventListener('keydown', event => {
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
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(item => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); });
    let visible = 0;
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && !card.dataset.category.split("|").includes(button.dataset.filter);
      if (!card.hidden) visible++;
    });
    const status = document.querySelector('#filter-status'); if (status) status.textContent = `Showing ${visible} ${visible === 1 ? 'item' : 'items'}`;
  }));
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
