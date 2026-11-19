/* Readable research cards with optional selection and layout-aware connections.
 * Filaments leave the core radially and end at each card's port; a pulse travels each
 * one in turn. Topics that cite the same page are joined by a dashed arc on an orbit
 * around the core while either is active, and the linked card names the shared work.
 * Animation pauses off screen. */
(() => {
  'use strict';
  const namespace = 'http://www.w3.org/2000/svg';
  const svgPath = className => {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('class', className);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    return path;
  };
  document.querySelectorAll('[data-research-map]').forEach(root => {
    const svg = root.querySelector('.research-map-lines');
    const hub = root.querySelector('[data-map-hub]');
    if (!svg || !hub) return;
    const records = [...root.querySelectorAll('article[data-map-node]')].map((node, index) => {
      const slug = node.dataset.mapNode;
      const button = [...node.querySelectorAll('[data-map-select]')].find(item => item.dataset.mapSelect === slug);
      if (!slug || !button) return null;
      const context = document.getElementById(button.getAttribute('aria-controls'));
      if (!context) return null;
      const path = svgPath('map-branch');
      path.dataset.mapBranch = slug;
      const pulse = svgPath('map-pulse');
      pulse.style.setProperty('--branch', String(index));
      svg.append(path, pulse);
      const evidence = new Set((node.dataset.mapEvidence || '').split(/\s+/).filter(Boolean));
      return { node, button, slug, path, pulse, context, evidence };
    }).filter(Boolean);
    if (!records.length) return;
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.pointerEvents = 'none';

    // Pairs of topics that link to the same page. Each card names the shared work in its own words.
    const chords = [];
    const linkText = (record, url) => [...record.node.querySelectorAll('a[href]')]
      .find(link => link.getAttribute('href') === url)?.textContent.trim() || 'Shared work';
    records.forEach((a, i) => records.slice(i + 1).forEach(b => {
      const shared = [...a.evidence].find(url => b.evidence.has(url));
      if (!shared) return;
      const path = svgPath('map-chord');
      svg.prepend(path);
      chords.push({ a: a.slug, b: b.slug, path, text: { [a.slug]: linkText(a, shared), [b.slug]: linkText(b, shared) } });
    }));
    records.forEach(record => {
      if (!chords.some(chord => chord.a === record.slug || chord.b === record.slug)) return;
      record.shared = document.createElement('span');
      record.shared.className = 'map-shared';
      record.shared.setAttribute('aria-hidden', 'true');
      record.node.append(record.shared);
    });

    let selected = null;
    let hovered = null;
    let focused = null;
    let lastInput = 'focus';
    let frame = 0;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

    function refresh() {
      const active = (lastInput === 'pointer' ? hovered || focused : focused || hovered) || selected;
      if (active) root.dataset.active = active;
      else delete root.dataset.active;
      if (selected) root.dataset.selected = selected;
      else delete root.dataset.selected;
      root.classList.toggle('has-selection', selected !== null);
      const linked = new Map();
      chords.forEach(chord => {
        const on = active === chord.a || active === chord.b;
        chord.path.classList.toggle('is-active', on);
        if (!on) return;
        const partner = active === chord.a ? chord.b : chord.a;
        linked.set(partner, chord.text[partner]);
      });
      records.forEach(record => {
        const highlighted = record.slug === active;
        record.node.classList.toggle('is-active', highlighted);
        record.node.classList.toggle('is-linked', linked.has(record.slug));
        if (record.shared && linked.has(record.slug)) record.shared.textContent = `Shared · ${linked.get(record.slug)}`;
        record.path.classList.toggle('is-active', highlighted);
        record.pulse.classList.toggle('is-active', highlighted);
        const expanded = record.slug === selected;
        record.button.setAttribute('aria-expanded', String(expanded));
        record.context.hidden = !expanded;
      });
    }

    function draw() {
      frame = 0;
      const width = root.clientWidth;
      const height = root.clientHeight;
      if (!width || !height) return;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const bounds = root.getBoundingClientRect();
      const originX = bounds.left + root.clientLeft;
      const originY = bounds.top + root.clientTop;
      const rect = element => {
        const box = element.getBoundingClientRect();
        return {
          left: box.left - originX, right: box.right - originX,
          top: box.top - originY, bottom: box.bottom - originY,
          width: box.width, height: box.height,
          x: box.left + box.width / 2 - originX,
          y: box.top + box.height / 2 - originY,
        };
      };
      const center = rect(hub);
      const nodes = records.map(record => ({ ...record, box: rect(record.node) }));
      const stacked = nodes.every(({ box }) => box.top >= center.bottom - 1);
      const trunkX = Math.max(2, Math.min(center.left, ...nodes.map(({ box }) => box.left)) - 14);
      const angles = new Map();
      nodes.forEach(({ slug, path, pulse, box }) => {
        let route;
        if (stacked) {
          // On phones, stay in the left gutter rather than crossing card text.
          const radius = Math.min(12, Math.max(0, (box.y - center.y) / 3));
          route = `M ${center.left} ${center.y} C ${trunkX} ${center.y}, ${trunkX} ${center.y}, ${trunkX} ${center.y + radius}` +
            ` L ${trunkX} ${box.y - radius} C ${trunkX} ${box.y}, ${trunkX} ${box.y}, ${box.left} ${box.y}`;

        } else {
          // Leave the core along the line toward the card, then turn level into its port.
          const direction = box.x < center.x ? -1 : 1;
          const end = { x: direction < 0 ? box.right : box.left, y: box.y };
          const dx = end.x - center.x;
          const dy = end.y - center.y;
          const length = Math.hypot(dx, dy) || 1;
          const radius = center.width / 2;
          const start = { x: center.x + dx / length * radius, y: center.y + dy / length * radius };
          angles.set(slug, Math.atan2(dy, dx));
          const reach = Math.min(44, Math.abs(end.x - start.x) * .45);
          const level = Math.min(80, Math.abs(end.x - start.x) * .5);
          route = `M ${start.x} ${start.y} C ${start.x + dx / length * reach} ${start.y + dy / length * reach},` +
            ` ${end.x - direction * level} ${end.y}, ${end.x} ${end.y}`;

        }
        path.setAttribute('d', route);
        pulse.setAttribute('d', route);
        pulse.style.setProperty('--len', path.getTotalLength().toFixed(1));
      });
      // Chords run along an orbit just outside the core, between the two branches' exits,
      // the shorter way round.
      const orbit = center.width / 2 + 13;
      chords.forEach(({ a, b, path }) => {
        if (stacked || !angles.has(a) || !angles.has(b)) { path.removeAttribute('d'); return; }
        const from = angles.get(a);
        let turn = angles.get(b) - from;
        while (turn > Math.PI) turn -= 2 * Math.PI;
        while (turn <= -Math.PI) turn += 2 * Math.PI;
        const to = from + turn;
        const point = angle => `${(center.x + Math.cos(angle) * orbit).toFixed(1)} ${(center.y + Math.sin(angle) * orbit).toFixed(1)}`;
        path.setAttribute('d', `M ${point(from)} A ${orbit} ${orbit} 0 0 ${turn > 0 ? 1 : 0} ${point(to)}`);
      });
    }
    function scheduleDraw() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function readFragment() {
      const match = records.find(record => '#interest-' + record.slug === location.hash);
      selected = match ? match.slug : null;
      hovered = focused = null;
      refresh();
      scheduleDraw();
    }

    function selectTopic(slug) {
      const fragment = slug ? '#interest-' + slug : '#research-interests';
      if (location.hash !== fragment) history.pushState(history.state, '', fragment);
      readFragment();
    }
    window.addEventListener('hashchange', readFragment);
    window.addEventListener('popstate', readFragment);
    window.addEventListener('pageshow', readFragment);
    records.forEach(({ node, button, slug }) => {
      node.addEventListener('pointerenter', () => {
        if (!finePointer.matches) return;
        hovered = slug; lastInput = 'pointer'; refresh();
      });
      node.addEventListener('pointerleave', () => {
        if (hovered === slug) hovered = null;
        refresh();
      });
      node.addEventListener('focusin', () => {
        focused = slug; lastInput = 'focus'; refresh();
      });
      node.addEventListener('focusout', () => {
        queueMicrotask(() => {
          if (focused === slug && !node.contains(document.activeElement)) focused = null;
          refresh();
        });
      });
      button.addEventListener('click', () => {
        selectTopic(selected === slug ? null : slug);
      });
    });
    hub.addEventListener('click', () => {
      selectTopic(null);
    });
    finePointer.addEventListener('change', event => {
      if (!event.matches) { hovered = null; refresh(); }
    });
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(scheduleDraw);
      [root, hub, ...records.map(record => record.node)].forEach(element => observer.observe(element));
    }
    // Pulses and the core's orbit run only while the map is on screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        entries.forEach(entry => root.classList.toggle('is-visible', entry.isIntersecting));
      }, { rootMargin: '80px 0px' }).observe(root);
    } else {
      root.classList.add('is-visible');
    }
    window.addEventListener('resize', scheduleDraw, { passive: true });
    window.addEventListener('pageshow', scheduleDraw);
    document.fonts?.ready.then(scheduleDraw, () => {});
    readFragment();
    draw();
    root.classList.add('is-interactive');
    hub.disabled = false;
    records.forEach(({ button }) => { button.disabled = false; });
  });
})();
