/* Details layered over studio.js: first-visit intro, live clock, portrait tracker,
 * timeline links, one-time reveals, lit surfaces, reading progress, section links,
 * copy, toast and keyboard shortcuts. Everything degrades to plain, static content. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  // The first-visit choreography runs once; afterwards hover and focus styles own transforms.
  if (root.dataset.intro === 'play') setTimeout(() => { delete root.dataset.intro; }, 2600);

  /* Toast: a visual confirmation plus a separate polite announcement. */
  const toast = document.querySelector('[data-toast]');
  const toastStatus = document.querySelector('[data-toast-status]');
  let toastTimer = 0;
  let toastLeave = 0;
  function hideToast() {
    if (!toast || toast.hidden) return;
    toast.classList.remove('is-entering');
    toast.classList.add('is-leaving');
    clearTimeout(toastLeave);
    toastLeave = setTimeout(() => {
      toast.classList.remove('is-leaving');
      try { if (toast.matches(':popover-open')) toast.hidePopover(); } catch { /* Not a popover here. */ }
      toast.hidden = true;
    }, reducedMotion.matches ? 0 : 180);
  }
  function showToast(message) {
    if (!message) return;
    if (toastStatus) {
      toastStatus.textContent = '';
      setTimeout(() => { toastStatus.textContent = message; }, 40);
    }
    if (!toast) return;
    clearTimeout(toastTimer);
    clearTimeout(toastLeave);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.remove('is-leaving', 'is-entering');
    // A manual popover sits in the top layer, above any open modal dialog.
    try { if (typeof toast.showPopover === 'function' && !toast.matches(':popover-open')) toast.showPopover(); } catch { /* Fixed element fallback. */ }
    void toast.offsetWidth;
    toast.classList.add('is-entering');
    toastTimer = setTimeout(hideToast, 2600);
  }
  document.addEventListener('site:toast', event => showToast(event.detail));

  /* Copy with a clipboard fallback for older browsers or insecure contexts. */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.append(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      field.remove();
      return copied;
    }
  }
  document.addEventListener('site:copy', async event => {
    const { text, message } = event.detail || {};
    if (!text) return;
    showToast(await copyText(text) ? message || 'Copied' : `Copy this: ${text}`);
  });
  document.querySelectorAll('[data-copy-text]').forEach(button => {
    button.hidden = false;
    const label = button.querySelector('span');
    button.addEventListener('click', async () => {
      const text = button.dataset.copyText;
      const copied = await copyText(text);
      showToast(copied ? button.dataset.copyMessage || 'Copied' : `Copy this: ${text}`);
      if (!copied) return;
      button.classList.add('is-copied');
      if (label) label.textContent = 'Copied';
      setTimeout(() => {
        button.classList.remove('is-copied');
        if (label) label.textContent = 'Copy';
      }, 1800);
    });
  });

  /* Local time in Guangzhou, refreshed on the minute and when the tab returns. */
  const clocks = [...document.querySelectorAll('[data-local-clock]')];
  if (clocks.length && window.Intl) {
    const zone = clocks[0].dataset.timezone || 'Asia/Shanghai';
    let clockFormat;
    let partsFormat;
    try {
      clockFormat = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      partsFormat = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    } catch { clockFormat = null; }
    if (clockFormat) {
      const zoneOffset = date => {
        const parts = Object.fromEntries(partsFormat.formatToParts(date).map(part => [part.type, part.value]));
        const asUTC = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
        return Math.round((asUTC - Math.floor(date.getTime() / 60000) * 60000) / 60000);
      };
      const formatOffset = minutes => {
        const sign = minutes < 0 ? '−' : '+';
        const hours = Math.floor(Math.abs(minutes) / 60);
        const rest = Math.abs(minutes) % 60;
        return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
      };
      const describe = date => {
        const offset = zoneOffset(date);
        const difference = offset + date.getTimezoneOffset();
        const label = formatOffset(offset);
        if (!difference) return `${label}, your time zone`;
        const hours = Math.abs(difference) / 60;
        const amount = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
        return `${label}, ${amount} ${hours === 1 ? 'hour' : 'hours'} ${difference > 0 ? 'ahead of' : 'behind'} you`;
      };
      let clockTimer = 0;
      const tick = () => {
        const now = new Date();
        const text = clockFormat.format(now);
        const detail = describe(now);
        for (const clock of clocks) {
          const time = clock.querySelector('time');
          if (time) { time.textContent = text; time.dateTime = now.toISOString(); }
          const offset = clock.querySelector('[data-clock-offset]');
          if (offset) offset.textContent = detail;
          else clock.title = `Local time in ${clock.dataset.place || zone.split('/').pop().replace(/_/g, ' ')}: ${detail}`;
          clock.hidden = false;
        }
        clearTimeout(clockTimer);
        clockTimer = setTimeout(tick, 60000 - (now.getTime() % 60000) + 40);
      };
      tick();
      document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    }
  }

  /* Portrait: a reticle follows a mouse or pen and reports normalized coordinates. */
  const portrait = document.querySelector('.profile-portrait');
  const tracker = portrait?.querySelector('.portrait-tracker');
  if (tracker) {
    const readout = tracker.querySelector('[data-tracker-readout]');
    let frame = 0;
    let point = { x: .5, y: .42 };
    const render = () => {
      frame = 0;
      tracker.style.setProperty('--tx', point.x.toFixed(3));
      tracker.style.setProperty('--ty', point.y.toFixed(3));
      if (readout) readout.textContent = `x ${point.x.toFixed(2)} y ${point.y.toFixed(2)}`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
    portrait.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const bounds = portrait.getBoundingClientRect();
      point = { x: clamp((event.clientX - bounds.left) / bounds.width), y: clamp((event.clientY - bounds.top) / bounds.height) };
      schedule();
    });
    portrait.addEventListener('pointerleave', () => { point = { x: .5, y: .42 }; schedule(); });
  }

  /* Timeline: hovering a list entry or a bar links the two; the pointer scrubs dates. */
  const trajectory = document.querySelector('[data-trajectory]');
  if (trajectory) {
    const spans = [...trajectory.querySelectorAll('[data-trajectory-key]')];
    const entries = [...document.querySelectorAll('.experience-list [data-trajectory-key]')];
    const rows = trajectory.querySelector('.trajectory-rows');
    // Pointer and keyboard keep separate claims; the pointer wins while it is present.
    let pointed = null;
    let focused = null;
    const show = () => {
      const key = pointed || focused;
      trajectory.classList.toggle('has-focus', Boolean(key));
      spans.forEach(span => span.classList.toggle('is-active', span.dataset.trajectoryKey === key));
      entries.forEach(entry => entry.classList.toggle('is-linked', entry.dataset.trajectoryKey === key));
    };
    const link = key => { pointed = key; show(); };
    entries.forEach(entry => {
      entry.addEventListener('pointerenter', () => link(entry.dataset.trajectoryKey));
      entry.addEventListener('pointerleave', () => link(null));
      entry.addEventListener('focusin', () => { focused = entry.dataset.trajectoryKey; show(); });
      entry.addEventListener('focusout', () => queueMicrotask(() => {
        if (!entry.contains(document.activeElement) && focused === entry.dataset.trajectoryKey) focused = null;
        show();
      }));
    });
    if (rows && finePointer.matches) {
      const scrub = document.createElement('span');
      scrub.className = 'trajectory-scrub';
      const scrubLabel = document.createElement('span');
      scrub.append(scrubLabel);
      trajectory.append(scrub);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const axisStart = Number(trajectory.dataset.axisStart);
      const axisMonths = Number(trajectory.dataset.axisYears) * 12;
      const prelude = trajectory.dataset.prelude || '';
      const style = getComputedStyle(trajectory);
      let frame = 0;
      let pointerX = 0;
      const render = () => {
        frame = 0;
        const bounds = trajectory.getBoundingClientRect();
        const mainStart = parseFloat(style.getPropertyValue('--main-start')) / 100;
        const ratio = clamp((pointerX - bounds.left) / bounds.width);
        let key = null;
        if (ratio < mainStart) {
          scrubLabel.textContent = prelude;
        } else {
          const month = Math.min(axisMonths - 1, Math.floor((ratio - mainStart) / (1 - mainStart) * axisMonths));
          scrubLabel.textContent = `${months[month % 12]} ${axisStart + Math.floor(month / 12)}`;
          const position = (month + .5) / axisMonths * 100;
          const hit = spans.find(span => position >= parseFloat(span.style.getPropertyValue('--from')) && position <= parseFloat(span.style.getPropertyValue('--to')) && span.closest('.trajectory-row')?.matches(':hover'));
          key = hit?.dataset.trajectoryKey || null;
        }
        scrub.style.setProperty('--scrub-x', `${(ratio * 100).toFixed(2)}%`);
        link(key);
      };
      trajectory.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch') return;
        pointerX = event.clientX;
        trajectory.classList.add('is-scrubbing');
        if (!frame) frame = requestAnimationFrame(render);
      });
      const stopScrubbing = () => {
        if (!trajectory.classList.contains('is-scrubbing')) return;
        trajectory.classList.remove('is-scrubbing');
        link(null);
      };
      trajectory.addEventListener('pointerleave', stopScrubbing);
      // Scrolling moves the chart under a still pointer, so the reading would be stale.
      window.addEventListener('scroll', stopScrubbing, { passive: true });
    }
  }

  /* One-time reveals for decorative rules and the timeline drawing. */
  const reveals = document.querySelectorAll('.section-index, [data-trajectory]');
  if (reveals.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver(items => {
      for (const item of items) {
        if (!item.isIntersecting) continue;
        item.target.classList.add('is-revealed');
        observer.unobserve(item.target);
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(element => observer.observe(element));
    // Printing or a changed preference shows everything at once.
    const revealAll = () => reveals.forEach(element => element.classList.add('is-revealed'));
    window.addEventListener('beforeprint', revealAll);
    reducedMotion.addEventListener('change', event => { if (event.matches) revealAll(); });
  }

  /* Lit surfaces follow the pointer. */
  if (finePointer.matches) {
    document.querySelectorAll('.work-robotics .selected-project:first-child, [data-spotlight]').forEach(surface => {
      surface.classList.add('spotlight-surface');
      let frame = 0;
      let x = 0;
      let y = 0;
      surface.addEventListener('pointermove', event => {
        const bounds = surface.getBoundingClientRect();
        x = event.clientX - bounds.left;
        y = event.clientY - bounds.top;
        if (!frame) frame = requestAnimationFrame(() => {
          frame = 0;
          surface.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
          surface.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
        });
      });
    });
  }

  /* Reading progress: CSS scroll timelines where supported, otherwise a passive listener. */
  const progress = document.querySelector('.reading-progress');
  if (progress) {
    const native = () => Boolean(window.CSS?.supports?.('animation-timeline: scroll()')) && !reducedMotion.matches;
    let frame = 0;
    let listening = false;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--progress', max > 0 ? clamp(window.scrollY / max).toFixed(4) : '0');
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const sync = () => {
      const needed = !native();
      if (needed && !listening) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        listening = true;
        update();
      } else if (!needed && listening) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        listening = false;
      }
    };
    sync();
    reducedMotion.addEventListener('change', sync);
  }

  /* Section links in posts and case studies; the link also copies the address. */
  document.querySelectorAll('.reading-prose :is(h2, h3)[id], .project-detail > .prose :is(h2, h3)[id]').forEach(heading => {
    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#${encodeURIComponent(heading.id)}`;
    anchor.setAttribute('aria-label', `Link to section: ${heading.textContent.trim()}`);
    anchor.addEventListener('click', async () => {
      const address = new URL(anchor.getAttribute('href'), location.href).href;
      if (await copyText(address)) showToast('Section link copied');
    });
    heading.append(anchor);
  });

  /* Keyboard shortcuts: ⌘K and / search, G then a letter navigates, T switches theme, ? lists them. */
  const shortcuts = document.querySelector('#shortcuts-dialog');
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (!isMac) document.querySelectorAll('.shortcuts-list kbd').forEach(key => { if (key.textContent === '⌘') key.textContent = 'Ctrl'; });
  function openShortcuts() {
    if (!shortcuts || shortcuts.open || typeof shortcuts.showModal !== 'function') return;
    document.querySelectorAll('dialog[open]').forEach(other => other.close());
    shortcuts.showModal();
  }
  if (shortcuts) {
    document.querySelectorAll('[data-shortcuts-open]').forEach(button => {
      button.hidden = false;
      button.addEventListener('click', openShortcuts);
    });
    shortcuts.querySelector('[data-shortcuts-close]')?.addEventListener('click', () => shortcuts.close());
    shortcuts.addEventListener('click', event => {
      if (event.target !== shortcuts) return;
      const bounds = shortcuts.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) shortcuts.close();
    });
    document.addEventListener('site:shortcuts', openShortcuts);
  }
  const destinations = new Map();
  document.querySelectorAll('.desktop-nav a').forEach(anchor => {
    const letter = anchor.textContent.trim().charAt(0).toLowerCase();
    if (letter && !destinations.has(letter)) destinations.set(letter, anchor.href);
  });
  const editable = target => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
  let awaitingDestination = 0;
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.isComposing || event.repeat) return;
    if (editable(event.target)) return;
    const openDialog = document.querySelector('dialog[open]');
    if (openDialog && openDialog !== shortcuts) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (awaitingDestination && Date.now() - awaitingDestination < 1500) {
      awaitingDestination = 0;
      const destination = destinations.get(key);
      if (destination) {
        event.preventDefault();
        shortcuts?.open && shortcuts.close();
        if (destination !== location.href) location.assign(destination);
      }
      return;
    }
    awaitingDestination = 0;
    if (key === 'g') { awaitingDestination = Date.now(); return; }
    if (key === '?') { event.preventDefault(); if (shortcuts?.open) shortcuts.close(); else openShortcuts(); return; }
    if (openDialog) return;
    if (key === '/') { event.preventDefault(); document.querySelector('.search-trigger')?.click(); return; }
    if (key === 't') { event.preventDefault(); document.querySelector('.theme-toggle')?.click(); }
  });
})();
