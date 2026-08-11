/* ===== Kevdog Productions — script.js ===== */

/* =============================================
   BOOKING LINK
   Replace with your Google Calendar appointment
   scheduling page URL. Go to:
   calendar.google.com → "Other calendars" →
   "Create new calendar" → Appointment schedules →
   copy the booking link.
   ============================================= */
const BOOKING_LINK = 'https://calendar.google.com/calendar/appointments/schedules/YOUR_SCHEDULE_ID';

/* =============================================
   VIDEO LINKS
   For each video category, paste a YouTube or
   Vimeo embed URL. Example YouTube embed URL:
   https://www.youtube.com/embed/VIDEO_ID
   ============================================= */
const VIDEO_EMBEDS = {
  'Political Messaging': '',   // e.g. 'https://www.youtube.com/embed/abc123'
  'Music Productions':   '',
  'Sporting Events':     '',
  'Community Events':    '',
};

/* ===== Tab switching ===== */
function switchTab(id, triggerEl) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');

  document.querySelectorAll('.hero-tagline').forEach(t => t.classList.remove('active'));
  const tagline = document.querySelector('.hero-tagline[data-tagline="' + id + '"]');
  if (tagline) tagline.classList.add('active');

  document.querySelectorAll('.nav-link, .tab-btn').forEach(b => {
    if (b.tagName === 'BUTTON') b.classList.remove('active');
  });
  if (triggerEl) {
    document.querySelectorAll('[onclick*="switchTab(\'' + id + '\'"]').forEach(el => {
      el.classList.add('active');
    });
  }
}

/* ===== Hero rotating words ===== */
const photoWords = ['Memories', 'Atmosphere', 'Product', 'Attractive Side', 'Talent'];
const videoWords = ['Clients', 'Audience', 'Voters', 'Target Demographic'];

let photoIdx = 0, videoIdx = 0;

function cycleWord(wrapKey, words, idx) {
  const wrap = document.querySelector('.rotate-word-wrap[data-rotate="' + wrapKey + '"]');
  const current = wrap && wrap.querySelector('.rotate-word');
  if (!wrap || !current) return idx;
  const nextIdx = (idx + 1) % words.length;

  const incoming = document.createElement('span');
  incoming.className = 'rotate-word rw-no-transition rw-enter-start';
  incoming.textContent = words[nextIdx];
  wrap.appendChild(incoming);
  void incoming.offsetWidth; // force reflow so the off-screen starting position applies first

  incoming.classList.remove('rw-no-transition', 'rw-enter-start');
  current.classList.add('rw-exit');

  setTimeout(() => { current.remove(); }, 350);
  return nextIdx;
}

setInterval(() => { photoIdx = cycleWord('photo-word', photoWords, photoIdx); }, 2800);
setInterval(() => { videoIdx = cycleWord('video-word', videoWords, videoIdx); }, 2600);

/* ===== Video modal ===== */
function openVideoModal(title, embedUrl) {
  const backdrop = document.getElementById('video-modal');
  document.getElementById('modal-title-text').textContent = title;
  const body = document.getElementById('modal-body');
  const url = embedUrl || VIDEO_EMBEDS[title] || '';

  if (url) {
    body.innerHTML = '<div class="modal-embed"><iframe src="' + url + '?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe></div>';
  } else {
    body.innerHTML = '<div class="modal-placeholder"><i class="ti ti-video-off" aria-hidden="true"></i><span>Video coming soon — add a YouTube embed link in script.js</span></div>';
  }

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal(event) {
  if (event && event.target !== document.getElementById('video-modal')) return;
  const backdrop = document.getElementById('video-modal');
  backdrop.classList.remove('open');
  document.getElementById('modal-body').innerHTML = '';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeVideoModal();
});

/* ===== Photo category modal (placeholder) ===== */
const nightlifeImages = Array.from({ length: 10 }, (_, index) => `images/covers/Music-${index + 1}.png`);
const nightlifeCaptions = [
  'Loud Luxury - Joe',
  'Loud Luxury - Chris',
  'Mac Demarco',
  'DJ Mandy',
  '',
  '',
  '',
  '',
  '',
  ''
];
let currentNightlifeIndex = 0;

function showNightlifePhoto() {
  const img = document.getElementById('nightlife-carousel-img');
  const caption = document.getElementById('nightlife-caption');
  if (!img) return;
  img.src = nightlifeImages[currentNightlifeIndex];
  img.alt = `Nightlife photo ${currentNightlifeIndex + 1}`;
  if (caption) {
    caption.textContent = nightlifeCaptions[currentNightlifeIndex] || '';
    caption.style.display = nightlifeCaptions[currentNightlifeIndex] ? 'block' : 'none';
  }
}

function changeNightlifePhoto(direction) {
  currentNightlifeIndex = (currentNightlifeIndex + direction + nightlifeImages.length) % nightlifeImages.length;
  showNightlifePhoto();
}

const corporateImages = Array.from({ length: 9 }, (_, index) => `images/covers/Corperate-${index + 1}.png`);
const corporateCaptions = Array.from({ length: 9 }, () => '');
let currentCorporateIndex = 0;

function showCorporatePhoto() {
  const img = document.getElementById('corporate-carousel-img');
  const caption = document.getElementById('corporate-caption');
  if (!img) return;
  img.src = corporateImages[currentCorporateIndex];
  img.alt = `Corporate photo ${currentCorporateIndex + 1}`;
  if (caption) {
    caption.textContent = corporateCaptions[currentCorporateIndex] || '';
    caption.style.display = corporateCaptions[currentCorporateIndex] ? 'block' : 'none';
  }
}

function changeCorporatePhoto(direction) {
  currentCorporateIndex = (currentCorporateIndex + direction + corporateImages.length) % corporateImages.length;
  showCorporatePhoto();
}

const portraitImages = Array.from({ length: 5 }, (_, index) => `images/covers/Portrait-${index + 1}.png`);
const portraitCaptions = Array.from({ length: 5 }, () => '');
let currentPortraitIndex = 0;

function showPortraitPhoto() {
  const img = document.getElementById('portrait-carousel-img');
  const caption = document.getElementById('portrait-caption');
  if (!img) return;
  img.src = portraitImages[currentPortraitIndex];
  img.alt = `Portrait photo ${currentPortraitIndex + 1}`;
  if (caption) {
    caption.textContent = portraitCaptions[currentPortraitIndex] || '';
    caption.style.display = portraitCaptions[currentPortraitIndex] ? 'block' : 'none';
  }
}

function changePortraitPhoto(direction) {
  currentPortraitIndex = (currentPortraitIndex + direction + portraitImages.length) % portraitImages.length;
  showPortraitPhoto();
}

const proposalImages = Array.from({ length: 3 }, (_, index) => `images/covers/Proposal-${index + 1}.png`);
const proposalCaptions = Array.from({ length: 3 }, () => '');
let currentProposalIndex = 0;

function showProposalPhoto() {
  const img = document.getElementById('proposal-carousel-img');
  const caption = document.getElementById('proposal-caption');
  if (!img) return;
  img.src = proposalImages[currentProposalIndex];
  img.alt = `Proposal photo ${currentProposalIndex + 1}`;
  if (caption) {
    caption.textContent = proposalCaptions[currentProposalIndex] || '';
    caption.style.display = proposalCaptions[currentProposalIndex] ? 'block' : 'none';
  }
}

function changeProposalPhoto(direction) {
  currentProposalIndex = (currentProposalIndex + direction + proposalImages.length) % proposalImages.length;
  showProposalPhoto();
}

const sportsImages = Array.from({ length: 3 }, (_, index) => `images/covers/Sports-${index + 1}.png`);
const sportsCaptions = Array.from({ length: 3 }, () => '');
let currentSportsIndex = 0;

function showSportsPhoto() {
  const img = document.getElementById('sports-carousel-img');
  const caption = document.getElementById('sports-caption');
  if (!img) return;
  img.src = sportsImages[currentSportsIndex];
  img.alt = `Sports photo ${currentSportsIndex + 1}`;
  if (caption) {
    caption.textContent = sportsCaptions[currentSportsIndex] || '';
    caption.style.display = sportsCaptions[currentSportsIndex] ? 'block' : 'none';
  }
}

function changeSportsPhoto(direction) {
  currentSportsIndex = (currentSportsIndex + direction + sportsImages.length) % sportsImages.length;
  showSportsPhoto();
}

/* ===== Wire up all booking buttons ===== */
document.addEventListener('DOMContentLoaded', () => {
  showNightlifePhoto();
  showCorporatePhoto();
  showPortraitPhoto();
  showProposalPhoto();
  showSportsPhoto();
  document.querySelectorAll('[href*="YOUR_SCHEDULE_ID"]').forEach(el => {
    el.href = BOOKING_LINK;
  });
});

/* ===== Header transparency on scroll ===== */
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      header.style.background = 'rgba(0, 21, 69, 0.97)';
    } else {
      header.style.background = 'rgba(0, 21, 69, 0.85)';
    }
  }, { passive: true });
}
