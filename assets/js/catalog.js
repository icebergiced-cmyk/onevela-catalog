/* ===========================
   Catalog interactions — scroll reveals, smooth nav
   =========================== */

(function () {
  'use strict';

  /* Smooth scroll TOC links (in scroll mode only — book mode handled by flipbook-init) */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    if (document.body.getAttribute('data-mode') === 'scroll') {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    } else if (window.__onevela) {
      // Book mode — turn to that page via StPageFlip
      const pf = window.__onevela.pageFlip();
      if (pf) {
        const pages = document.querySelectorAll('#book > .page');
        const idx = Array.from(pages).findIndex(p => p.id === id);
        if (idx >= 0) {
          e.preventDefault();
          pf.turnToPage(idx);
        }
      }
    }
  });

  /* Scroll-fade-in for sections (scroll mode only) */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.fade-in, .page').forEach(el => io.observe(el));
  }

  /* Update footer year (not used currently but reserved) */
  const yr = document.getElementById('year');
  if (yr) yr.textContent = String(new Date().getFullYear() + 543); // Buddhist year
})();
