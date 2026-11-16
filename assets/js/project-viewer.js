/* Progressive image viewing and an outline for long project descriptions. */
(() => {
  'use strict';
  const project = document.querySelector('.project-detail');
  if (!project) return;
  const content = project.querySelector('.prose.page-content');
  const headings = [...(content?.querySelectorAll('h2[id]') || [])];
  if (headings.length >= 3) {
    const navigation = document.createElement('nav');
    navigation.className = 'project-outline';
    navigation.setAttribute('aria-label', 'On this page');
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'On this page';
    const list = document.createElement('ul');
    headings.forEach(heading => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${encodeURIComponent(heading.id)}`;
      link.textContent = heading.textContent.trim();
      item.append(link); list.append(item);
    });
    const desktop = matchMedia('(min-width: 681px)');
    details.open = desktop.matches;
    desktop.addEventListener('change', event => { details.open = event.matches; });
    details.append(summary, list); navigation.append(details); content.before(navigation);
  }

  const dialog = document.querySelector('#project-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  // Only the detail hero and existing screenshot figures form this gallery.
  // Video posters, project-list thumbnails, and unrelated images keep their behavior.
  const links = [...project.querySelectorAll('a[data-project-viewer], .project-screenshot > a')]
    .filter(link => link.querySelector('img') && /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(link.href));
  if (!links.length) return;
  const viewport = dialog.querySelector('.project-viewer-viewport');
  const image = dialog.querySelector('.project-viewer-image');
  const caption = dialog.querySelector('.project-viewer-caption');
  const counter = dialog.querySelector('.project-viewer-count');
  const status = dialog.querySelector('.project-viewer-status');
  const original = dialog.querySelector('[data-viewer-original]');
  const sizeButton = dialog.querySelector('[data-viewer-size]');
  const previous = dialog.querySelector('[data-viewer-previous]');
  const next = dialog.querySelector('[data-viewer-next]');
  let index = 0;
  let opener = null;
  let actualSize = false;

  function setSize(actual) {
    actualSize = actual;
    viewport.classList.toggle('is-actual-size', actual);
    sizeButton.setAttribute('aria-pressed', String(actual));
    sizeButton.textContent = actual ? 'Fit image' : 'Actual size';
    viewport.scrollTop = 0; viewport.scrollLeft = 0;
  }
  function show(position) {
    index = (position + links.length) % links.length;
    const link = links[index];
    const source = link.querySelector('img');
    const sourceCaption = link.closest('figure')?.querySelector('figcaption');
    setSize(false);
    image.hidden = true;
    status.hidden = false;
    status.textContent = 'Loading image…';
    viewport.setAttribute('aria-busy', 'true');
    image.alt = source.alt;
    image.src = link.href;
    original.href = link.href;
    counter.textContent = `Image ${index + 1} of ${links.length}`;
    caption.replaceChildren();
    if (sourceCaption) {
      sourceCaption.childNodes.forEach(node => caption.append(node.cloneNode(true)));
    } else caption.textContent = source.alt;
    caption.hidden = !caption.textContent.trim();
  }
  image.addEventListener('load', () => {
    image.hidden = false;
    status.hidden = true;
    viewport.removeAttribute('aria-busy');
  });
  image.addEventListener('error', () => {
    image.hidden = true;
    status.hidden = false;
    status.textContent = 'This image could not be loaded. Try Open original.';
    viewport.removeAttribute('aria-busy');
  });
  previous.hidden = next.hidden = links.length < 2;
  dialog.querySelector('.project-viewer-stage').classList.toggle('is-single', links.length < 2);
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  sizeButton.addEventListener('click', () => setSize(!actualSize));
  dialog.querySelector('[data-viewer-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // At actual size, arrow keys scroll the image when its viewport has focus.
    if (actualSize && document.activeElement === viewport) return;
    if (links.length > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault(); show(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('project-viewer-open');
    setSize(false);
    opener?.focus({ preventScroll: true });
  });
  links.forEach((link, position) => {
    link.classList.add('project-media-link');
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      opener = link;
      show(position);
      dialog.showModal();
      document.body.classList.add('project-viewer-open');
    });
  });
})();
