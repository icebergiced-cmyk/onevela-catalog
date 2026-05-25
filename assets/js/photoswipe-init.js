/* ===========================
   PhotoSwipe init — bound to .pswp-trigger overlay
   Avoids StPageFlip pointer-event conflict
   =========================== */

import PhotoSwipeLightbox from 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js';

const lightbox = new PhotoSwipeLightbox({
  gallery: '#book',
  children: 'figure',
  pswpModule: () => import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js'),
  bgOpacity: 0.94,
  showHideAnimationType: 'fade',
  closeTitle: 'ปิด',
  zoomTitle: 'ซูม',
  arrowPrevTitle: 'ก่อน',
  arrowNextTitle: 'ถัดไป',
});

// Tell PhotoSwipe how to read our <figure> children
lightbox.addFilter('domItemData', (itemData, element) => {
  const img = element.querySelector('img[data-pswp-src]');
  if (!img) return itemData;
  itemData.src = img.dataset.pswpSrc || img.src;
  itemData.w = parseInt(img.dataset.pswpW, 10) || img.naturalWidth || 1600;
  itemData.h = parseInt(img.dataset.pswpH, 10) || img.naturalHeight || 1131;
  itemData.msrc = img.src;
  return itemData;
});

// Only the overlay button or image click should trigger — but PhotoSwipe binds to <figure>.
// Click on the trigger or img is fine; we just block click from propagating to StPageFlip.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.pswp-trigger');
  if (trigger) {
    e.stopPropagation();
    const figure = trigger.closest('figure');
    if (figure) {
      // Simulate click on the figure (PhotoSwipe listens there)
      const evt = new MouseEvent('click', { bubbles: true });
      figure.dispatchEvent(evt);
    }
  }
}, true);

lightbox.init();
