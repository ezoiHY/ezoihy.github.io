// Share a comparison by copying the current project archive URL.
(() => {
  const board = document.querySelector('#compare-projects');
  if (!board) return;
  const selectors = [...board.querySelectorAll('[data-compare-select]')];
  const defaults = selectors.map(select => select.value);
  const allowed = new Set([...selectors[0].options].map(option => option.value));
  const records = new Map([...document.querySelectorAll('[data-compare-key]')]
    .filter(card => allowed.has(card.dataset.compareKey))
    .map(card => [card.dataset.compareKey, card.dataset]));
  const headers = [...board.querySelectorAll('thead a')];
  const rows = [...board.querySelectorAll('[data-compare-field]')];
  const status = board.querySelector('.compare-status');
  const share = board.querySelector('.compare-share');
  const copyButton = share.querySelector('button');
  const copyField = share.querySelector('input');
  let pair = defaults;

  function resetCopyLabel() {
    copyField.hidden = true;
    copyButton.textContent = 'Copy comparison link';
  }

  function render(keys, announce = false) {
    pair = keys;
    resetCopyLabel();
    keys.forEach((key, index) => {
      const record = records.get(key);
      selectors[index].value = key;
      headers[index].textContent = record.shortTitle;
      headers[index].dataset.projectLink = '';
      headers[index].dataset.projectUrl = record.projectUrl;
      for (const row of rows) row.cells[index + 1].textContent = record[row.dataset.compareField];
    });
    if (announce) status.textContent = 'Comparing ' + headers.map(link => link.textContent).join(' and ') + '.';
  }

  function updateLocation() {
    const url = new URL(location.href);
    if (board.open) {
      url.searchParams.set('compare', pair.join(','));
      url.hash = 'compare-projects';
    } else {
      url.searchParams.delete('compare');
      if (url.hash === '#compare-projects') url.hash = '';
    }
    if (url.href !== location.href) history.replaceState(history.state, '', url);
    board.dispatchEvent(new Event('projectcomparisonchange', { bubbles: true }));
  }

  function restoreFromLocation() {
    const url = new URL(location.href);
    const keys = (url.searchParams.get('compare') || '').split(',');
    const valid = keys.length === 2 && keys[0] !== keys[1] && keys.every(key => records.has(key));
    render(valid ? keys : defaults);
    board.open = valid || url.hash === '#compare-projects';
    if (!valid && url.searchParams.has('compare')) updateLocation();
    else board.dispatchEvent(new Event('projectcomparisonchange', { bubbles: true }));
  }

  selectors.forEach((select, index) => {
    select.addEventListener('change', () => {
      const next = [...pair];
      const opposite = 1 - index;
      // Choosing the opposite project exchanges the two columns.
      if (select.value === pair[opposite]) next[opposite] = pair[index];
      next[index] = select.value;
      render(next, true);
      updateLocation();
    });
  });
  board.addEventListener('toggle', updateLocation);
  copyButton.addEventListener('click', async () => {
    updateLocation();
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      if (location.href === url) copyButton.textContent = 'Copied';
    } catch {
      if (location.href !== url) return;
      copyField.hidden = false;
      copyField.value = url;
      copyField.focus();
      copyField.select();
    }
  });
  // Changing a filter also changes the address that can be copied.
  const explorer = board.closest('[data-project-explorer]');
  explorer.addEventListener('input', event => {
    if (event.target.matches('#project-search')) resetCopyLabel();
  });
  explorer.addEventListener('click', event => {
    if (event.target.closest('[data-filter], [data-project-view], [data-project-reset]')) resetCopyLabel();
  });
  window.addEventListener('popstate', restoreFromLocation);
  window.addEventListener('hashchange', () => {
    if (location.hash === '#compare-projects' && !board.open) board.open = true;
  });
  restoreFromLocation();
  board.querySelector('.compare-controls').hidden = false;
  share.hidden = false;
})();
