/* ===========================
   Plausible analytics (privacy-friendly, no cookies)
   ขั้นตอน setup:
   1. ไปสมัคร plausible.io หรือ self-host
   2. เพิ่มโดเมนใน dashboard
   3. แก้ data-domain="" ด้านล่างเป็นโดเมนจริง (เช่น "onevela.com" หรือ "username.github.io")
   4. uncomment script tag ด้านล่าง (ลบบรรทัด /* ออก)
   =========================== */

/*
const script = document.createElement('script');
script.defer = true;
script.setAttribute('data-domain', 'YOUR-DOMAIN-HERE');
script.src = 'https://plausible.io/js/script.js';
document.head.appendChild(script);
*/
