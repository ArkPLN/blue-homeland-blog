import { MIN_QUERY_LENGTH, searchPosts } from '../lib/client-search.js';

function initGlobalSearch() {
  const root = document.querySelector('[data-global-search-root]');

  if (!(root instanceof HTMLDivElement)) {
    throw new Error('Search root failed to initialize.');
  }

  const endpoint = root.dataset.searchEndpoint ?? '/search-index.json';
  const openButton = root.querySelector('[data-search-open]');
  const overlay = root.querySelector('[data-search-overlay]');
  const panel = root.querySelector('[data-search-panel]');
  const backdrop = root.querySelector('[data-search-backdrop]');
  const closeButton = root.querySelector('[data-search-close]');
  const input = root.querySelector('[data-search-input]');
  const idleState = root.querySelector('[data-search-idle]');
  const loadingState = root.querySelector('[data-search-loading]');
  const emptyState = root.querySelector('[data-search-empty]');
  const resultsWrap = root.querySelector('[data-search-results-wrap]');
  const resultsContainer = root.querySelector('[data-search-results]');
  const meta = root.querySelector('[data-search-meta]');

  if (
    !(openButton instanceof HTMLButtonElement) ||
    !(overlay instanceof HTMLDivElement) ||
    !(panel instanceof HTMLElement) ||
    !(backdrop instanceof HTMLDivElement) ||
    !(closeButton instanceof HTMLButtonElement) ||
    !(input instanceof HTMLInputElement) ||
    !(idleState instanceof HTMLDivElement) ||
    !(loadingState instanceof HTMLDivElement) ||
    !(emptyState instanceof HTMLDivElement) ||
    !(resultsWrap instanceof HTMLDivElement) ||
    !(resultsContainer instanceof HTMLDivElement) ||
    !(meta instanceof HTMLParagraphElement)
  ) {
    throw new Error('Search UI failed to initialize.');
  }

  let isOpen = false;
  let activeQuery = '';
  let debounceTimer = 0;
  let closeTimer = 0;
  let lastResults = [];

  function setOpen(nextOpen) {
    window.clearTimeout(closeTimer);
    isOpen = nextOpen;
    overlay.setAttribute('aria-hidden', String(!nextOpen));
    openButton.setAttribute('aria-expanded', String(nextOpen));
    document.body.classList.toggle('overflow-hidden', nextOpen);

    if (nextOpen) {
      overlay.classList.remove('hidden', 'pointer-events-none');
      requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        panel.classList.remove('translate-y-8', 'scale-[0.96]');
        panel.classList.add('translate-y-0', 'scale-100', 'search-panel-active');
      });
      window.setTimeout(() => input.focus(), 30);
      void runSearch(input.value);
    } else {
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      panel.classList.remove('translate-y-0', 'scale-100', 'search-panel-active');
      panel.classList.add('translate-y-8', 'scale-[0.96]');
      closeTimer = window.setTimeout(() => {
        overlay.classList.add('hidden', 'pointer-events-none');
      }, 320);
      input.blur();
    }
  }

  function setState(state) {
    idleState.classList.toggle('hidden', state !== 'idle');
    loadingState.classList.toggle('hidden', state !== 'loading');
    emptyState.classList.toggle('hidden', state !== 'empty');
    resultsWrap.classList.toggle('hidden', state !== 'results');
  }

  function createBadge(label) {
    const badge = document.createElement('span');
    badge.className = 'rounded-full px-2.5 py-1 text-[11px] font-medium';
    badge.textContent = label === 'title' ? '标题命中' : '正文命中';
    badge.classList.add(
      label === 'title' ? 'bg-sky-100' : 'bg-emerald-100',
      label === 'title' ? 'text-sky-700' : 'text-emerald-800',
    );
    return badge;
  }

  function renderResults(results, query) {
    lastResults = results;
    resultsContainer.innerHTML = '';
    meta.textContent = `关键词 “${query}” 找到 ${results.length} 条结果`;

    results.forEach((item, index) => {
      const link = document.createElement('a');
      link.href = item.url;
      link.className =
        'search-result-item group block rounded-[1.7rem] border border-slate-200 bg-white/92 p-5 text-slate-900 shadow-[0_12px_30px_rgba(148,163,184,0.12)] transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_18px_40px_rgba(148,163,184,0.18)] focus:outline-none focus:ring-2 focus:ring-sky-200 motion-reduce:transform-none motion-reduce:transition-none';
      link.style.setProperty('--search-stagger', `${index * 55}ms`);

      const topRow = document.createElement('div');
      topRow.className = 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between';

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0 flex-1';

      const title = document.createElement('h3');
      title.className = 'break-words text-lg font-semibold leading-tight tracking-[-0.025em] text-slate-900 [overflow-wrap:anywhere] transition group-hover:text-sky-700';
      title.textContent = item.title;

      const excerpt = document.createElement('p');
      excerpt.className = 'mt-3 break-words text-sm leading-7 text-slate-600';
      excerpt.textContent = item.excerpt;

      textWrap.append(title, excerpt);

      const metaWrap = document.createElement('div');
      metaWrap.className = 'flex flex-wrap items-center gap-2 text-xs sm:justify-end';
      if (item.date) {
        const date = document.createElement('span');
        date.className = 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-500';
        date.textContent = item.date;
        metaWrap.appendChild(date);
      }
      for (const field of item.matchedFields) {
        metaWrap.appendChild(createBadge(field));
      }

      topRow.append(textWrap, metaWrap);
      link.appendChild(topRow);
      link.addEventListener('click', () => setOpen(false));
      resultsContainer.appendChild(link);
    });
  }

  async function runSearch(query) {
    const trimmed = query.trim();
    activeQuery = trimmed;

    if (trimmed.length < MIN_QUERY_LENGTH) {
      lastResults = [];
      setState('idle');
      resultsContainer.innerHTML = '';
      meta.textContent = '';
      return;
    }

    setState('loading');

    try {
      const results = await searchPosts(trimmed, {
        endpoint,
        limit: 8,
      });

      if (activeQuery !== trimmed) {
        return;
      }

      if (results.length === 0) {
        lastResults = [];
        setState('empty');
        resultsContainer.innerHTML = '';
        meta.textContent = '';
        return;
      }

      setState('results');
      renderResults(results, trimmed);
    } catch (error) {
      console.error(error);
      lastResults = [];
      setState('empty');
      resultsContainer.innerHTML = '';
      meta.textContent = '';
    }
  }

  openButton.addEventListener('click', () => setOpen(true));
  closeButton.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));

  input.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      void runSearch(input.value);
    }, 160);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && lastResults[0]) {
      window.location.href = lastResults[0].url;
    }
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTypingTarget =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    if ((event.key === 'k' && (event.ctrlKey || event.metaKey)) || (!isTypingTarget && event.key === '/')) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setOpen(false);
    }
  });
}

initGlobalSearch();
