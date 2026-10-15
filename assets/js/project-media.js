/* Silent project previews. Load/play only when visible; keep a real poster as
   the no-JS/error/reduced-motion fallback and provide a keyboard-accessible pause. */
(() => {
  const hosts = [...document.querySelectorAll('[data-project-motion]')];
  if (!hosts.length) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData;
  const records = hosts.map(host => {
    const video = host.querySelector('video');
    const button = host.querySelector('button');
    const state = { host, video, button, visible: !('IntersectionObserver' in window), intent: null };
    video.muted = true;
    button.hidden = false;
    const label = () => {
      button.textContent = video.paused ? 'Play preview' : 'Pause preview';
    };
    button.addEventListener('click', () => {
      state.intent = video.paused;
      update(state);
    });
    video.addEventListener('playing', () => {
      if (!shouldPlay(state)) video.pause();
      else host.classList.add('is-ready');
      label();
    });
    video.addEventListener('pause', label);
    video.addEventListener('error', () => {
      host.classList.remove('is-ready');
      button.hidden = true;
    });
    return state;
  });
  function shouldPlay(state) {
    const requested = state.intent === true || (state.intent !== false && !reducedMotion.matches && !saveData);
    return requested && state.visible && !document.hidden;
  }
  function update(state) {
    if (shouldPlay(state)) {
      if (state.video.paused) state.video.play().catch(() => {
        // Autoplay may be blocked (for example in low power mode). The poster
        // and manual play button remain available without a broken media box.
        state.button.textContent = 'Play preview';
      });
    } else state.video.pause();
  }
  const refresh = () => records.forEach(update);
  if ('IntersectionObserver' in window) {
    const byHost = new Map(records.map(state => [state.host, state]));
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state = byHost.get(entry.target);
        state.visible = entry.isIntersecting;
        update(state);
      });
    }, { threshold: .1 });
    records.forEach(state => visibility.observe(state.host));
  }
  reducedMotion.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('pagehide', () => records.forEach(state => state.video.pause()));
  window.addEventListener('pageshow', refresh);
  refresh();
})();
