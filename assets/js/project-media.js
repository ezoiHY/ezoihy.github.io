/* Personal previews are manual; lab demos loop quietly while visible. */
(() => {
  const hosts = [...document.querySelectorAll('[data-project-motion]')];
  const labVideos = [...document.querySelectorAll('video[data-lab-demo]')];
  if (!hosts.length && !labVideos.length) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canObserve = 'IntersectionObserver' in window;
  const records = hosts.map(host => {
    const video = host.querySelector('video');
    const button = host.querySelector('button');
    const status = host.querySelector('.project-motion-status');
    const state = { host, video, button, visible: !canObserve, intent: null, pending: false, failed: false, request: 0, timeout: null };
    video.muted = true;
    button.hidden = false;
    const label = () => {
      button.textContent = state.failed ? 'Retry preview' : state.pending ? 'Cancel loading' : video.paused ? 'Play preview' : 'Pause preview';
      if (state.pending) button.setAttribute('aria-busy', 'true');
      else button.removeAttribute('aria-busy');
    };
    state.label = label;
    state.fail = message => {
      cancelRequest(state);
      state.intent = false;
      state.failed = true;
      video.pause();
      host.classList.remove('is-ready');
      if (status) {
        status.textContent = message || 'Preview unavailable. Select Retry preview to try again.';
        status.hidden = false;
      }
      label();
    };
    button.addEventListener('click', () => {
      state.intent = state.pending ? false : state.failed || video.paused;
      if (state.failed && state.intent) {
        state.failed = false;
        if (status) status.hidden = true;
        video.load();
      }
      update(state);
    });
    video.addEventListener('playing', () => {
      cancelRequest(state);
      if (!shouldPlay(state)) video.pause();
      else {
        host.classList.add('is-ready');
        if (status) status.hidden = true;
      }
      label();
    });
    video.addEventListener('pause', () => {
      // Ignore a queued pause event from a request that has already been retried.
      if (video.paused) { cancelRequest(state); label(); }
    });
    // A failed <source> does not bubble its error to the video element.
    video.addEventListener('error', () => state.fail());
    video.querySelector('source')?.addEventListener('error', () => state.fail());
    return state;
  });
  // Personal previews are mutually exclusive. Visible lab demos can loop together.
  records.forEach(({ video }) => video.addEventListener('play', () => {
    records.forEach(state => { if (state.video !== video) state.intent = false; });
    records.forEach(state => { if (state.video !== video) update(state); });
    if (document.hidden) video.pause();
  }));
  const labRecords = labVideos.map(video => {
    const media = video.closest('.lab-demo-media');
    const button = media.querySelector('.lab-demo-play');
    const poster = media.querySelector('.lab-demo-poster');
    let pending = false;
    let failed = false;
    let playRequest = 0;
    let loadTimeout = null;
    let automaticPauses = 0;
    let blocked = false;
    const title = video.closest('.lab-demo')?.querySelector('h3')?.textContent.trim() || 'demonstration';
    const message = video.closest('.lab-demo')?.querySelector('.lab-demo-error');
    const fallbackMessage = message?.textContent || 'Preview unavailable. Watch the demonstration at the source below.';
    // null follows automatic playback; true/false preserve explicit user intent.
    const state = { video, visible: !canObserve, intent: null };
    video.muted = true;
    // Keep native controls as the no-script fallback; enhanced demos share the
    // same persistent preview button as personal project videos.
    video.controls = false;
    video.tabIndex = -1;
    media.classList.add('is-enhanced');
    poster.hidden = false;
    button.hidden = false;
    video.inert = true;
    const label = () => {
      button.textContent = failed ? 'Retry preview' : pending ? 'Cancel loading' : video.paused ? 'Play preview' : 'Pause preview';
      button.setAttribute('aria-label', `${button.textContent}: ${title}`);
      if (pending) button.setAttribute('aria-busy', 'true');
      else button.removeAttribute('aria-busy');
    };
    const resetButton = () => {
      playRequest++;
      clearTimeout(loadTimeout);
      loadTimeout = null;
      pending = false;
      label();
    };
    const showError = (text = fallbackMessage) => {
      failed = true;
      pause();
      if (message) { message.textContent = text; message.hidden = false; }
      media.classList.remove('is-ready');
      video.inert = true;
    };
    const allowed = () => state.visible && !document.hidden && state.intent !== false &&
      (state.intent === true || (canObserve && !reducedMotion.matches && !blocked));
    const pause = () => {
      // Invalidate pending work before pause() can reject its play promise.
      resetButton();
      if (!video.paused) { automaticPauses++; video.pause(); }
      label();
    };
    const play = () => {
      if (pending || !video.paused) return;
      if (failed) { failed = false; video.load(); }
      const request = ++playRequest;
      pending = true;
      label();
      loadTimeout = setTimeout(() => {
        if (request === playRequest && pending) showError('This demonstration took too long to load. Retry or watch it at the source below.');
      }, 20000);
      video.play().catch(error => {
        if (request !== playRequest) return;
        // Cancelled and superseded requests have already been invalidated.
        if (error.name === 'AbortError') resetButton();
        else if (error.name === 'NotAllowedError') { blocked = true; pause(); }
        else showError();
      });
    };
    state.update = () => {
      if (allowed()) { if (!failed) play(); }
      else pause();
    };
    state.pause = pause;
    button.addEventListener('click', () => {
      if (pending || !video.paused) { state.intent = false; pause(); return; }
      state.intent = true;
      blocked = false;
      if (allowed()) play();
    });
    video.addEventListener('play', () => {
      // A queued event from a cancelled request is not a manual-play gesture.
      if (video.paused) return;
      if (failed) { pause(); return; }
      if (!pending) state.intent = true;
      if (!allowed()) pause();
    });
    video.addEventListener('pause', () => {
      if (automaticPauses) automaticPauses--;
      else if (video.paused) { state.intent = false; resetButton(); }
      label();
    });
    video.addEventListener('playing', () => {
      if (failed || video.paused || !allowed()) { pause(); return; }
      failed = false;
      resetButton();
      if (message) message.hidden = true;
      video.inert = false;
      media.classList.add('is-ready');
    });
    video.addEventListener('error', () => showError());
    video.querySelector('source')?.addEventListener('error', () => showError());
    return state;
  });
  function shouldPlay(state) {
    const requested = state.intent === true;
    return requested && state.visible && !document.hidden;
  }
  function cancelRequest(state) {
    state.request++;
    clearTimeout(state.timeout);
    state.timeout = null;
    state.pending = false;
  }
  function update(state) {
    if (shouldPlay(state)) {
      if (!state.video.paused || state.pending) return;
      const request = ++state.request;
      state.pending = true;
      state.label();
      // Some browsers leave play() pending after a source fails or stalls.
      // Keep loading cancellable and offer a deliberate retry instead of hanging.
      state.timeout = setTimeout(() => {
        if (request === state.request && state.pending) state.fail('Preview took too long to load. Select Retry preview to try again.');
      }, 20000);
      state.video.play().catch(error => {
        if (request !== state.request) return;
        state.fail(error.name === 'NotAllowedError'
          ? 'Playback was blocked. Select Retry preview to try again.'
          : 'Preview unavailable. Select Retry preview to try again.');
      });
    } else {
      cancelRequest(state);
      state.video.pause();
      state.label();
    }
  }
  const refresh = () => { records.forEach(update); labRecords.forEach(state => state.update()); };
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
    const byVideo = new Map(labRecords.map(state => [state.video, state]));
    const labVisibility = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state = byVideo.get(entry.target);
        state.visible = entry.isIntersecting && entry.intersectionRatio >= .1;
        state.update();
      });
    }, { threshold: .1 });
    labVideos.forEach(video => labVisibility.observe(video));
  }
  document.addEventListener('visibilitychange', refresh);
  reducedMotion.addEventListener('change', () => labRecords.forEach(state => state.update()));
  window.addEventListener('pagehide', () => {
    records.forEach(state => { cancelRequest(state); state.video.pause(); state.label(); });
    labRecords.forEach(state => state.pause());
  });
  window.addEventListener('pageshow', refresh);
  refresh();
})();
