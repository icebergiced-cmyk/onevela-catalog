# วันเวลา · One Vela — Catalog Site

แคตตาลอคบ้านแบบ flipbook ดิจิทัล โครงการ "วันเวลา · One Vela" คลองตำหรุ ชลบุรี โดย บริษัท ทู บิลด์ ดีเวลลอปเมนท์ จำกัด

Static site — HTML + CSS + JS เท่านั้น ไม่มี build step ใช้ CDN libraries Deploy บน GitHub Pages ได้ทันที

## โครงสร้างไฟล์

```
/index.html                  Landing splash + CTA เข้าแคตตาลอค
/catalog.html                แคตตาลอคหลัก — flipbook (≥1024px) / long-scroll (<1024px)
/faq-*.html                  5 บทความ FAQ ลูกค้า — ใช้แชร์ LINE/Facebook แยกได้
/404.html
/assets/
  /css/tokens.css            Brand palette + type scale + spacing
  /css/catalog.css           Magazine page layouts (cover, type spreads, FAQ)
  /css/flipbook.css          StPageFlip overrides
  /css/print.css             @media print A4 pagination
  /js/flipbook-init.js       StPageFlip + responsive switch + a11y
  /js/photoswipe-init.js     Image zoom (overlay trigger เลี่ยง pointer bug)
  /js/catalog.js             Page interactions (toggle, deep links)
  /js/analytics.js           Plausible snippet
  /og/                       Open Graph images 1200×630 (per FAQ + master)
/images/
  /covers/                   Cover + back cover + landing hero
  /types/{a,b,c,d}/          รูปบ้าน 4 ไทป์ (exterior + interior + isometric)
  /common/                   ส่วนกลาง (สวน, ฟิตเนส, night)
  /masterplan/               ผังโครงการ
  /logo/                     โลโก้ Primary / White / Icon
/.nojekyll                   ปิด Jekyll ของ GitHub Pages
/sitemap.xml /robots.txt /favicon.ico
```

## 🎨 Tone-of-Voice Lock (สำคัญสำหรับงานต่อยอด)

แม้แบรนด์ใช้ชื่อคู่กัน "**วันเวลา · One Vela**" — DNA ของโครงการนี้คือ **"วันเวลา" family-warmth** (ครอบครัว, อบอุ่น, ค่อยๆ ผ่อน) **ไม่ใช่ "One Vela" premium-luxury** ของโครงการอมตะ

- Lockup: "วันเวลา" Thai-first ตัวใหญ่ — "One Vela" Latin secondary ตัวเล็กกว่า
- Headlines: 5–7 คำไทย conversational
- ห้ามใช้: "Luxury", "Exclusive", "บ้านในฝัน", "ตอบโจทย์ทุกไลฟ์สไตล์", "Live your dream"
- ใช้ได้: "ครอบครัว", "ลูก", "ที่อยู่ที่สบายใจ", "ค่อยๆ ผ่อน"
- Palette: cream `#FAF7F2` · charcoal `#2C2825` · gold `#B8843D` · sage `#7A8471`
- Type: Prompt (TH) + Inter (EN labels, small caps)

## 🚀 Deploy บน GitHub Pages

```bash
cd "/path/to/this/folder"
git init
git add -A
git commit -m "feat: launch วันเวลา · One Vela catalog"

# สร้าง repo ใหม่ (ผ่าน gh CLI ที่ติดตั้งแล้ว)
gh repo create onevela-catalog --public --source=. --push

# Enable GitHub Pages จาก main branch root
gh api repos/{owner}/onevela-catalog/pages -X POST \
  -f source.branch=main -f source.path=/

# Live URL จะอยู่ที่:
# https://{your-github-username}.github.io/onevela-catalog/
```

ใช้เวลา ~30 วินาทีหลัง push GitHub Pages จะ build เสร็จ

### ถ้ามี custom domain (เช่น onevela.com)

1. uncomment + แก้ไขไฟล์ `CNAME` ที่ root
2. ตั้ง DNS ของโดเมน → A record ไปที่ GitHub IPs
3. enable HTTPS ในหน้า repo Settings → Pages

## 🖨 Export เป็น PDF (handout sales gallery)

เปิด `/catalog.html` ใน **Chrome** → กด `Cmd+P` (หรือ Ctrl+P)
- Destination: Save as PDF
- Layout: Portrait
- Pages: All
- Margins: None
- Background graphics: ✅ ON

จะได้ไฟล์ PDF 32 หน้า A4 พิมพ์ได้เลย

## 📝 อัพเดท content ในอนาคต

- **ราคา / spec บ้าน:** แก้ใน `/catalog.html` ตรงหน้า TYPE A–D
- **ข้อมูลติดต่อ:** แก้ทั้งใน `/index.html` (JSON-LD + ลิงก์) และ `/catalog.html` (Visit page)
- **เพิ่ม/แก้ FAQ:** สร้างไฟล์ใหม่ `/faq-XXX.html` (copy จาก existing FAQ เป็น template), แล้วเพิ่ม entry ใน `sitemap.xml`
- **เปลี่ยนรูป:** แทนที่ไฟล์เดิมใน `/images/...` ชื่อเดิม (จะอัปเดตทั้งเว็บทีเดียว)

## 🔧 Libraries (CDN)

- [StPageFlip 2.0.7](https://nodlik.github.io/StPageFlip/) — flipbook
- [GSAP 3.12 + ScrollTrigger](https://gsap.com/) — scroll animations
- [PhotoSwipe 5.4](https://photoswipe.com/) — image zoom
- Google Fonts: Prompt + Inter

## 📞 ติดต่อ

- โทร: 09-2787-4222
- LINE: @605odwus
- Email: twobuild.d@gmail.com
- ที่อยู่: 89 หมู่ 1 ตำบลคลองตำหรุ อำเภอเมืองชลบุรี ชลบุรี 20000

---

© Two Build Development Co., Ltd.
