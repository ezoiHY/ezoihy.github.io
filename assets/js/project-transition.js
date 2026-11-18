// The browser owns navigation and scroll restoration. Name just the image pair
// involved in this navigation, reusing the same history entry on Back.
(() => {
  if (!window.navigation || !('onpagereveal' in window)) return;
  const { home, projects } = document.currentScript.dataset;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function matchingImage(other) {
    if (document.querySelector('dialog[open]')) return null;
    if (other.pathname === home || other.pathname === projects) {
      if (other.searchParams.get('view') === 'list') return null;
      return document.querySelector('.project-detail .project-figure img');
    }
    if (document.querySelector('[data-project-explorer][data-view="list"]')) return null;
    const card = [...document.querySelectorAll('[data-project-url]')]
      .find(item => item.dataset.projectUrl === other.pathname);
    return card?.querySelector('.project-visual img, .selected-project-image img');
  }

  function pair(transition, entry) {
    if (!transition) return;
    // Skipping a snapshot rejects ready, including normal outgoing-page teardown.
    // Navigation still finishes. Observe that rejection before deciding to skip.
    transition.ready.catch(() => {});
    const image = entry?.url && !reduced.matches ? matchingImage(new URL(entry.url)) : null;
    const bounds = image?.getBoundingClientRect();
    if (!bounds || !bounds.width || !bounds.height ||
        bounds.bottom <= 0 || bounds.top >= innerHeight ||
        bounds.right <= 0 || bounds.left >= innerWidth) {
      transition.skipTransition();
      return;
    }
    image.style.viewTransitionName = 'project-image';
    transition.finished.then(() => { image.style.viewTransitionName = ''; });
  }
  addEventListener('pageswap', event => pair(event.viewTransition, event.activation?.entry));
  addEventListener('pagereveal', event => pair(event.viewTransition, navigation.activation?.from));
})();
