(() => {
  const jumpBar = document.querySelector('.home-jumps');
  const jumps = [...document.querySelectorAll('.home-jumps a')].map(link => ({
    link, heading: document.getElementById(link.hash.slice(1)),
  })).filter(item => item.heading);
  // One pill slides between sections; the current link keeps its own state without it.
  const pill = jumpBar && document.createElement('div');
  if (pill) {
    pill.className = 'home-jumps-pill';
    pill.setAttribute('aria-hidden', 'true');
    jumpBar.append(pill);
    jumpBar.classList.add('has-pill');
  }
  let marked = null;
  function placePill(item) {
    if (!pill) return;
    if (!item) { pill.classList.remove('is-visible'); return; }
    const bar = jumpBar.getBoundingClientRect();
    const rect = item.link.getBoundingClientRect();
    pill.style.setProperty('--pill-x', `${(rect.left - bar.left - jumpBar.clientLeft).toFixed(1)}px`);
    pill.style.setProperty('--pill-w', `${rect.width.toFixed(1)}px`);
    pill.classList.add('is-visible');
  }
  let scheduled = false;
  function markSection() {
    scheduled = false;
    const endOfPage = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const current = endOfPage ? jumps.at(-1) : jumps.filter(item => item.heading.getBoundingClientRect().top <= 120).at(-1);
    for (const item of jumps) {
      if (item === current) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
    if (current !== marked) { marked = current; placePill(current); }
  }
  if ('ResizeObserver' in window && jumpBar) new ResizeObserver(() => placePill(marked)).observe(jumpBar);
  function scheduleUpdate() {
    if (!scheduled) requestAnimationFrame(markSection);
    scheduled = true;
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  markSection();

  const dialog = document.querySelector('#quick-look');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const projects = [...document.querySelectorAll('.selected-project')].map(row => ({
    trigger: row.querySelector('[data-quick-trigger]'),
    template: row.querySelector('template[data-quick-content]'),
  })).filter(project => project.trigger && project.template);
  const body = dialog.querySelector('[data-quick-body]');
  const status = dialog.querySelector('[data-quick-status]');
  const counter = dialog.querySelector('[data-quick-count]');
  const previous = dialog.querySelector('.quick-prev');
  const next = dialog.querySelector('[data-quick-next]');
  let selected = 0;
  let opener;

  function showProject(index) {
    if (dialog.open) body.dataset.step = index > selected ? 'next' : 'previous';
    else delete body.dataset.step;
    selected = (index + projects.length) % projects.length;
    body.replaceChildren(projects[selected].template.content.cloneNode(true));
    const position = (selected + 1) + ' of ' + projects.length;
    counter.textContent = position;
    status.textContent = body.querySelector('h2').textContent + ', ' + position;
    dialog.scrollTop = 0;
  }
  projects.forEach(({ trigger }, index) => {
    trigger.hidden = false;
    trigger.addEventListener('click', () => {
      opener = trigger;
      showProject(index);
      dialog.showModal();
      document.body.classList.add('quick-open');
    });
  });
  previous.hidden = next.hidden = projects.length < 2;
  previous.addEventListener('click', () => showProject(selected - 1));
  next.addEventListener('click', () => showProject(selected + 1));
  dialog.querySelector('[data-quick-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showProject(selected + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  // Horizontal swipes turn the page. The browser retains vertical scroll and pinch zoom.
  let touchStart;
  body.addEventListener('pointerdown', event => {
    touchStart = event.pointerType === 'touch' && event.isPrimary && event.target.closest('.quick-figure img')
      ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
  });
  body.addEventListener('pointercancel', () => { touchStart = null; });
  body.addEventListener('pointerup', event => {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    const deltaX = event.clientX - touchStart.x;
    const deltaY = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(deltaX) > 46 && Math.abs(deltaX) > 1.5 * Math.abs(deltaY)) showProject(selected + (deltaX < 0 ? 1 : -1));
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('quick-open');
    if (!document.querySelector('dialog[open]')) opener?.focus({ preventScroll: true });
  });
})();
