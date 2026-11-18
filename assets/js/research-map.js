/* Readable research cards with optional selection and layout-aware connections. */
(() => {
  'use strict';
  const namespace = 'http://www.w3.org/2000/svg';
  document.querySelectorAll('[data-research-map]').forEach(root => {
    const svg = root.querySelector('.research-map-lines');
    const hub = root.querySelector('[data-map-hub]');
    if (!svg || !hub) return;
    const records = [...root.querySelectorAll('article[data-map-node]')].map(node => {
      const slug = node.dataset.mapNode;
      const button = [...node.querySelectorAll('[data-map-select]')].find(item => item.dataset.mapSelect === slug);
      if (!slug || !button) return null;
      const path = document.createElementNS(namespace, 'path');
      path.dataset.mapBranch = slug;
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.append(path);
      const context = document.getElementById(button.getAttribute('aria-controls'));
      if (!context) return null;
      return { node, button, slug, path, context };
    }).filter(Boolean);
    if (!records.length) return;
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.pointerEvents = 'none';

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
      records.forEach(record => {
        const highlighted = record.slug === active;
        record.node.classList.toggle('is-active', highlighted);
        record.path.classList.toggle('is-active', highlighted);
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
          x: box.left + box.width / 2 - originX,
          y: box.top + box.height / 2 - originY,
        };
      };
      const center = rect(hub);
      const nodes = records.map(record => ({ ...record, box: rect(record.node) }));
      const stacked = nodes.every(({ box }) => box.top >= center.bottom - 1);
      const trunkX = Math.max(2, Math.min(center.left, ...nodes.map(({ box }) => box.left)) - 14);
      nodes.forEach(({ path, box }) => {
        let route;
        if (stacked) {
          // On phones, stay in the left gutter rather than crossing card text.
          const radius = Math.min(12, Math.max(0, (box.y - center.y) / 3));
          route = `M ${center.left} ${center.y} C ${trunkX} ${center.y}, ${trunkX} ${center.y}, ${trunkX} ${center.y + radius}` +
            ` L ${trunkX} ${box.y - radius} C ${trunkX} ${box.y}, ${trunkX} ${box.y}, ${box.left} ${box.y}`;
        } else {
          const direction = box.x < center.x ? -1 : 1;
          const startX = direction < 0 ? center.left : center.right;
          const endX = direction < 0 ? box.right : box.left;
          const bend = Math.min(72, Math.abs(endX - startX) / 2);
          route = `M ${startX} ${center.y} C ${startX + direction * bend} ${center.y}, ${endX - direction * bend} ${box.y}, ${endX} ${box.y}`;
        }
        path.setAttribute('d', route);
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
