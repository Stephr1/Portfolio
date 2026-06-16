# Kevdog Productions — Portfolio Website

**kevdog.productions** · Kevin Heieis · Photographer & Videographer

---

## Deploy to GitHub Pages (free hosting)

1. Create a free account at [github.com](https://github.com)
2. Click **New repository** → name it `kevdog.productions` (or any name)
3. Upload all files from this folder, or use Git:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git remote add origin https://github.com/YOUR_USERNAME/kevdog.productions.git
   git push -u origin main
   ```
4. In the repo → **Settings** → **Pages** → Source: `main` branch → Save
5. Your site will be live at `https://YOUR_USERNAME.github.io/kevdog.productions`

**Custom domain** (`kevdog.productions`): In GitHub Pages settings, add your custom domain, then point your domain's DNS to GitHub's servers (they'll show you the IPs).

---

## How to customize

### Add your logo
Replace the 🐶 emoji in `index.html` and `gallery.html` with:
```html
<img src="images/logo.png" alt="Kevdog Productions logo">
```
Drop your logo file into the `images/` folder.

### Add your hero video / showreel
Drop your reel file as `images/reel.mp4`.  
For a static poster image (shown before video loads): `images/hero-poster.jpg`

### Add photos to the home page cards
In `index.html`, find each `<div class="photo-card-img">` and replace the `<i>` icon line with:
```html
<img src="images/proposals-cover.jpg" alt="Proposal photography">
```

### Add photos to the Gallery page
In `gallery.html`, find each `<div class="masonry-item">` and replace the placeholder div with:
```html
<img src="images/gallery/your-photo.jpg" alt="Describe the photo" loading="lazy">
```
Set `data-category` to: `proposals` | `corporate` | `parties` | `portraits` | `nightlife` | `sports`

### Connect Google Calendar booking
1. Go to [calendar.google.com](https://calendar.google.com)
2. Create a calendar → **Appointment schedules** → configure your availability
3. Click **Open booking page** → copy the URL
4. In `script.js`, replace `YOUR_SCHEDULE_ID` in the `BOOKING_LINK` constant with your full URL

### Add video embeds
In `script.js`, fill in the `VIDEO_EMBEDS` object:
```js
const VIDEO_EMBEDS = {
  'Political Messaging': 'https://www.youtube.com/embed/YOUR_VIDEO_ID',
  'Music Productions':   'https://www.youtube.com/embed/YOUR_VIDEO_ID',
  ...
};
```
Get the embed URL from YouTube: **Share** → **Embed** → copy the `src` URL.

### Update contact info
- Email: search for `kevin@kevdog.productions` in both HTML files and replace with your email
- Instagram is already set to `@kevdog.productions`

---

## File structure

```
Kevin_Portfolio/
├── index.html          ← main page (hero + Photo/Video/About tabs)
├── gallery.html        ← full masonry gallery with filters + lightbox
├── style.css           ← all styles (UBC Thunderbirds color palette)
├── script.js           ← tab switching, rotating words, video modal, booking
├── images/
│   ├── logo.png        ← your logo (optional, emoji is fallback)
│   ├── reel.mp4        ← your hero showreel video
│   ├── hero-poster.jpg ← still frame shown before video loads
│   └── gallery/        ← all your portfolio photos go here
└── README.md
```
