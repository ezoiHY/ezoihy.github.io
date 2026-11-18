// The browser owns navigation and scroll restoration. Name just the image pair
// involved in this navigation, reusing the same history entry on Back.
(() => {
  if (!window.navigation || !('onpagereveal' in window)) return;
  const { home, projects } = document.currentScript.dataset;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function visible(image) {
    const bounds = image?.getBoundingClientRect();
    return bounds?.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight &&
      bounds.right > 0 && bounds.left < innerWidth;
  }

  function matchingImage(other) {
    if (document.querySelector('dialog[open]')) return null;
    if (other.pathname === home || other.pathname === projects) {
      if (other.searchParams.get('view') === 'list') return null;
      return document.querySelector('.project-detail .project-figure img');
    }
    if (document.querySelector('[data-project-explorer][data-view="list"]')) return null;
    const frames = [...document.querySelectorAll('[data-project-url]')]
      .filter(item => item.dataset.projectUrl === other.pathname);
    const focused = frames.find(item => item.contains(document.activeElement));
    if (focused) frames.unshift(focused);
    for (const frame of frames) {
      const image = frame.querySelector('.project-visual img, .selected-project-image img, .archive-hardware-link img');
      if (visible(image)) return image;
    }
    return null;
  }

  function pair(transition, entry) {
    if (!transition) return;
    // Skipping a snapshot rejects ready, including normal outgoing-page teardown.
    // Navigation still finishes. Observe that rejection before deciding to skip.
    transition.ready.catch(() => {});
    const image = entry?.url && !reduced.matches ? matchingImage(new URL(entry.url)) : null;
    if (!visible(image)) {
      transition.skipTransition();
      return;
    }
    image.style.viewTransitionName = 'project-image';
    transition.finished.then(() => { image.style.viewTransitionName = ''; });
  }
  addEventListener('pageswap', event => pair(event.viewTransition, event.activation?.entry));
  addEventListener('pagereveal', event => pair(event.viewTransition, navigation.activation?.from));
})();
