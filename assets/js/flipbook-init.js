/* ===========================
   วันเวลา · One Vela — Flipbook engine
   Handles: StPageFlip init, mode switch, a11y, keyboard nav, deep-link
   =========================== */

(function () {
  'use strict';

  const BREAKPOINT = 1024;
  const STORAGE_KEY = 'onevela_mode';
  const PAGE_W = 800;
  const PAGE_H = 1131;

  const body = document.body;
  const book = document.getElementById('book');
  const folioEl = document.getElementById('folio-display');
  const btnBook = document.getElementById('mode-book');
  const btnScroll = document.getElementById('mode-scroll');
  const flipHint = document.getElementById('flip-hint');

  const pages = Array.from(book.querySelectorAll('.page'));
  const totalPages = pages.length;

  let pageFlip = null;
  let currentMode = null;

  /* ---------- Mode detection ---------- */
  function pickMode() {
    // Honor stored preference if window can support it
    const stored = localStorage.getItem(STORAGE_KEY);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const widthOk = window.innerWidth >= BREAKPOINT;
    if (reducedMotion) return 'scroll';
    if (!widthOk) return 'scroll';
    if (stored === 'book' || stored === 'scroll') return stored;
    return 'book';
  }

  /* ---------- Folio update ---------- */
  function updateFolio(pageNum) {
    if (!folioEl) return;
    folioEl.textContent = `หน้า ${pageNum} / ${totalPages}`;
  }

  /* ---------- Book mode (StPageFlip) ---------- */
  function initBookMode() {
    if (pageFlip) return; // already initialized
    if (typeof St === 'undefined' || !St.PageFlip) {
      console.warn('StPageFlip not loaded — falling back to scroll mode');
      setMode('scroll');
      return;
    }

    // Create container element (StPageFlip will wrap our pages)
    pageFlip = new St.PageFlip(book, {
      width: PAGE_W,
      height: PAGE_H,
      size: 'stretch',
      minWidth: 340,
      maxWidth: PAGE_W,
      minHeight: 480,
      maxHeight: PAGE_H,
      maxShadowOpacity: 0.35,
      showCover: true,
      mobileScrollSupport: false,
      usePortrait: false,
      drawShadow: true,
      flippingTime: 700,
      useMouseEvents: true,
      swipeDistance: 30,
      clickEventForward: true, // let inner <a> clicks bubble
    });

    pageFlip.loadFromHTML(pages);
    pageFlip.on('flip', (e) => {
      const idx = e.data; // 0-based
      updateFolio(idx + 1);
      // Update URL hash for deep-linking
      const page = pages[idx];
      if (page && page.id) {
        history.replaceState(null, '', '#' + page.id);
      }
    });

    pageFlip.on('init', (e) => {
      updateFolio((e.data?.page ?? 0) + 1);
      // Restore deep-link
      const targetId = (location.hash || '').replace('#', '');
      if (targetId) {
        const idx = pages.findIndex(p => p.id === targetId);
        if (idx >= 0) pageFlip.turnToPage(idx);
      }
    });

    // Show flip hint briefly
    if (flipHint) {
      flipHint.classList.add('visible');
      setTimeout(() => flipHint.classList.remove('visible'), 5000);
    }

    // Add nav buttons
    if (!document.querySelector('.book-nav')) {
      const nav = document.createElement('div');
      nav.className = 'book-nav';
      nav.innerHTML = `
        <button id="bk-prev" aria-label="หน้าก่อน">←</button>
        <button id="bk-next" aria-label="หน้าถัดไป">→</button>
      `;
      document.body.appendChild(nav);
      document.getElementById('bk-prev').addEventListener('click', () => pageFlip?.flipPrev());
      document.getElementById('bk-next').addEventListener('click', () => pageFlip?.flipNext());
    }
  }

  function destroyBookMode() {
    if (!pageFlip) return;
    try {
      pageFlip.destroy();
    } catch (e) { /* noop */ }
    pageFlip = null;
    // StPageFlip might leave wrapper — clean if present
    const wrapper = document.querySelector('.stf__parent');
    if (wrapper) {
      // Move pages back to #book
      const items = wrapper.querySelectorAll('.page');
      items.forEach(p => book.appendChild(p));
      wrapper.remove();
    }
    const nav = document.querySelector('.book-nav');
    if (nav) nav.remove();
  }

  /* ---------- Scroll mode ---------- */
  function initScrollMode() {
    // Find current visible page on scroll for folio updates
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const num = parseInt(entry.target.dataset.page, 10);
            if (!isNaN(num)) updateFolio(num);
          }
        });
      }, { threshold: 0.55 });
      pages.forEach(p => io.observe(p));
      // store for cleanup
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

  /* ---------- Mode switching ---------- */
  function setMode(mode) {
    if (mode === currentMode) return;

    // Tear down old
    if (currentMode === 'book') destroyBookMode();
    if (currentMode === 'scroll') destroyScrollMode();

    body.setAttribute('data-mode', mode);
    currentMode = mode;
    if (mode === 'book') initBookMode();
    else initScrollMode();

    // Update toggle state
    if (btnBook) btnBook.setAttribute('aria-pressed', mode === 'book');
    if (btnScroll) btnScroll.setAttribute('aria-pressed', mode === 'scroll');
  }

  function userSetMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    setMode(mode);
  }

  /* ---------- Keyboard a11y ---------- */
  function handleKey(e) {
    if (currentMode !== 'book' || !pageFlip) return;
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
      case 'Escape': {
        // If a photoswipe instance is open, let it handle it
        if (document.querySelector('.pswp--open')) return;
        userSetMode('scroll');
        e.preventDefault();
        break;
      }
    }
  }

  /* ---------- Resize handling ---------- */
  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const width = window.innerWidth;
      // Force scroll below breakpoint regardless of preference
      if (width < BREAKPOINT && currentMode === 'book') {
        setMode('scroll');
      }
      // If user prefers book and width is now sufficient, restore
      if (width >= BREAKPOINT) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'book' && currentMode === 'scroll') {
          setMode('book');
        }
      }
    }, 200);
  }

  /* ---------- Boot ---------- */
  document.documentElement.classList.add('js-ready');

  // Hook toggle buttons
  if (btnBook) btnBook.addEventListener('click', () => userSetMode('book'));
  if (btnScroll) btnScroll.addEventListener('click', () => userSetMode('scroll'));

  // Defer book init until StPageFlip is loaded
  window.addEventListener('DOMContentLoaded', () => {
    setMode(pickMode());
  });

  window.addEventListener('keydown', handleKey);
  window.addEventListener('resize', onResize);

  // Expose for debugging
  window.__onevela = { pageFlip: () => pageFlip, setMode: userSetMode };
})();
