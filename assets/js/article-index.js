// Use the rendered heading IDs so the index also works with custom Markdown anchors.
(() => {
  const category = new URLSearchParams(location.search).get('category');
  const matchingCategory = [...document.querySelectorAll('[data-post-category]')]
    .find(link => link.dataset.postCategory === category);
  if (matchingCategory) {
    for (const link of document.querySelectorAll('[data-writing-return]')) {
      link.href = matchingCategory.href;
      const label = link.querySelector('[data-return-label]');
      if (label) label.textContent = 'Back to ' + category;
    }
  }

  const index = document.querySelector('.reading-index');
  const headings = document.querySelectorAll('.reading-prose h2[id]');
  if (!index || headings.length < 2) return;

  const list = index.querySelector('ul');
  for (const heading of headings) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#' + encodeURIComponent(heading.id);
    link.textContent = heading.textContent;
    item.append(link);
    list.append(item);
  }
  const narrow = window.matchMedia('(max-width: 680px)');
  const applyLayout = () => { index.open = !narrow.matches; };
  applyLayout();
  narrow.addEventListener('change', applyLayout);
  index.hidden = false;
})();
