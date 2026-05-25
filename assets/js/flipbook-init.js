/* ===========================
   วันเวลา · One Vela — Flipbook engine
   StPageFlip init + mode switch + a11y + keyboard nav + deep-link
   =========================== */

(function () {
  'use strict';

  const BREAKPOINT = 1024;
  const STORAGE_KEY = 'onevela_mode';

  const body = document.body;
  const book = document.getElementById('book');
  const folioEl = document.getElementById('folio-display');
  const btnBook = document.getElementById('mode-book');
  const btnScroll = document.getElementById('mode-scroll');
  const flipHint = document.getElementById('flip-hint');

  if (!book) {
    console.warn('[flipbook] #book not found, abort');
    return;
  }

  let totalPages = book.querySelectorAll('.page').length;
  let pageFlip = null;
  let currentMode = null;
  let bookNavEl = null;

  /* ---------- helpers ---------- */
  function pickMode() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return 'scroll';
    if (window.innerWidth < BREAKPOINT) return 'scroll';
    if (stored === 'book' || stored === 'scroll') return stored;
    return 'book';
  }

  function updateFolio(pageNum) {
    if (folioEl) folioEl.textContent = `หน้า ${pageNum} / ${totalPages}`;
  }

  function setBtnState(mode) {
    if (btnBook) btnBook.setAttribute('aria-pressed', mode === 'book');
    if (btnScroll) btnScroll.setAttribute('aria-pressed', mode === 'scroll');
  }

  /* ---------- wait for StPageFlip CDN ---------- */
  function waitForSt(maxMs = 5000) {
    return new Promise((resolve) => {
      if (typeof St !== 'undefined' && St.PageFlip) return resolve(true);
      const start = Date.now();
      const tick = () => {
        if (typeof St !== 'undefined' && St.PageFlip) return resolve(true);
        if (Date.now() - start > maxMs) return resolve(false);
        setTimeout(tick, 80);
      };
      tick();
    });
  }

  /* ---------- book mode ---------- */
  async function initBookMode() {
    if (pageFlip) return;

    const ready = await waitForSt();
    if (!ready) {
      console.error('[flipbook] StPageFlip CDN failed to load — staying in scroll mode');
      forceScrollFallback();
      return;
    }

    // re-query pages live (they're still direct children of #book)
    const pages = book.querySelectorAll('.page');
    totalPages = pages.length;

    try {
      pageFlip = new St.PageFlip(book, {
        width: 800,
        height: 1131,
        size: 'stretch',
        minWidth: 380,
        maxWidth: 900,
        minHeight: 540,
        maxHeight: 1280,
        drawShadow: true,
        flippingTime: 700,
        usePortrait: false,
        autoSize: true,
        maxShadowOpacity: 0.35,
        showCover: true,
        mobileScrollSupport: false,
        useMouseEvents: true,
        swipeDistance: 30,
        clickEventForward: true,
        showPageCorners: true,
      });

      pageFlip.loadFromHTML(pages);

      pageFlip.on('flip', (e) => {
        const idx = e.data;
        updateFolio(idx + 1);
        const targetPage = pages[idx];
        if (targetPage && targetPage.id) {
          history.replaceState(null, '', '#' + targetPage.id);
        }
      });

      pageFlip.on('init', (e) => {
        const idx = (e.data && e.data.page) || 0;
        updateFolio(idx + 1);
        // restore deep-link
        const targetId = (location.hash || '').replace('#', '');
        if (targetId) {
          const tIdx = Array.from(pages).findIndex(p => p.id === targetId);
          if (tIdx >= 0) pageFlip.turnToPage(tIdx);
        }
      });

      mountBookNav();
      showHint();
    } catch (err) {
      console.error('[flipbook] init failed', err);
      forceScrollFallback();
    }
  }

  function forceScrollFallback() {
    localStorage.setItem(STORAGE_KEY, 'scroll');
    body.setAttribute('data-mode', 'scroll');
    currentMode = 'scroll';
    setBtnState('scroll');
    if (btnBook) {
      btnBook.disabled = true;
      btnBook.title = 'โหลด flipbook ไม่ได้';
      btnBook.style.opacity = '0.4';
    }
    initScrollMode();
  }

  function destroyBookMode() {
    if (!pageFlip) return;
    try { pageFlip.destroy(); } catch (e) { /* noop */ }
    pageFlip = null;

    // remove StPageFlip wrapper artifacts and ensure pages are back as #book children
    const wrapper = document.querySelector('.stf__parent');
    if (wrapper && wrapper !== book) {
      const items = wrapper.querySelectorAll('.page');
      items.forEach(p => book.appendChild(p));
      wrapper.remove();
    }
    // also reset any inline styles StPageFlip applied to #book itself
    book.removeAttribute('style');
    book.classList.remove('stf__parent');
    unmountBookNav();
  }

  /* ---------- nav arrows (book mode only) ---------- */
  function mountBookNav() {
    if (bookNavEl) return;
    bookNavEl = document.createElement('div');
    bookNavEl.className = 'book-nav';
    bookNavEl.innerHTML = `
      <button type="button" id="bk-prev" aria-label="หน้าก่อน">←</button>
      <button type="button" id="bk-next" aria-label="หน้าถัดไป">→</button>
    `;
    document.body.appendChild(bookNavEl);
    document.getElementById('bk-prev').addEventListener('click', () => pageFlip && pageFlip.flipPrev());
    document.getElementById('bk-next').addEventListener('click', () => pageFlip && pageFlip.flipNext());
  }
  function unmountBookNav() {
    if (bookNavEl) { bookNavEl.remove(); bookNavEl = null; }
  }

  function showHint() {
    if (!flipHint) return;
    flipHint.classList.add('visible');
    setTimeout(() => flipHint.classList.remove('visible'), 4500);
  }

  /* ---------- scroll mode ---------- */
  function initScrollMode() {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const num = parseInt(entry.target.dataset.page, 10);
            if (!isNaN(num)) updateFolio(num);
          }
        });
      }, { threshold: 0.55 });
      const pages = book.querySelectorAll('.page');
      pages.forEach(p => io.observe(p));
      initScrollMode._io = io;
    }
    updateFolio(1);
  }
  function destroyScrollMode() {
    if (initScrollMode._io) {
      initScrollMode._io.disconnect();
      initScrollMode._io = null;
    }
  }

  /* ---------- switch ---------- */
  async function setMode(mode) {
    if (mode === currentMode) return;

    if (currentMode === 'book') destroyBookMode();
    if (currentMode === 'scroll') destroyScrollMode();

    body.setAttribute('data-mode', mode);
    currentMode = mode;
    setBtnState(mode);

    if (mode === 'book') {
      await initBookMode();
    } else {
      initScrollMode();
    }
  }

  function userSetMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    setMode(mode);
  }

  /* ---------- keyboard ---------- */
  function handleKey(e) {
    if (currentMode !== 'book' || !pageFlip) return;
    if (document.querySelector('.pswp--open')) return; // photoswipe open
    switch (e.key) {
      case 'ArrowLeft':
      case 'PageUp':
        pageFlip.flipPrev(); e.preventDefault(); break;
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        pageFlip.flipNext(); e.preventDefault(); break;
      case 'Home':
        pageFlip.turnToPage(0); e.preventDefault(); break;
      case 'End':
        pageFlip.turnToPage(totalPages - 1); e.preventDefault(); break;
      case 'Escape':
        userSetMode('scroll'); e.preventDefault(); break;
    }
  }

  /* ---------- resize ---------- */
  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = window.innerWidth;
      if (w < BREAKPOINT && currentMode === 'book') {
        setMode('scroll');
      } else if (w >= BREAKPOINT) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'book' && currentMode === 'scroll') setMode('book');
      }
    }, 220);
  }

  /* ---------- boot — run immediately (script is at end of body, DOM is ready) ---------- */
  document.documentElement.classList.add('js-ready');

  if (btnBook) btnBook.addEventListener('click', () => userSetMode('book'));
  if (btnScroll) btnScroll.addEventListener('click', () => userSetMode('scroll'));

  window.addEventListener('keydown', handleKey);
  window.addEventListener('resize', onResize);

  // start now (don't wait for DOMContentLoaded — already fired by the time this runs)
  setMode(pickMode());

  // expose for debugging
  window.__onevela = {
    pageFlip: () => pageFlip,
    setMode: userSetMode,
    mode: () => currentMode,
    init: initBookMode,
  };
})();
