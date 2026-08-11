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
  'Corporate Events': 'images/covers/Corperate Events.mp4',
  'Music':              '',
  'Sports':              '',
  'Interviews':          '',
};

/* ===== Tab switching ===== */
function preloadSectionVideos(sectionEl, timeout = 700) {
  const videos = sectionEl.querySelectorAll('video');
  if (!videos.length) return Promise.resolve();

  const preloadPromises = Array.from(videos).map(video => new Promise(resolve => {
    if (video.readyState >= 3) return resolve();

    const done = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      video.removeEventListener('canplaythrough', done);
      video.removeEventListener('loadeddata', done);
      video.removeEventListener('error', done);
    };

    video.addEventListener('canplaythrough', done);
    video.addEventListener('loadeddata', done);
    video.addEventListener('error', done);
    if (video.readyState === 0) video.load();
  }));

  return Promise.race([
    Promise.all(preloadPromises),
    new Promise(resolve => setTimeout(resolve, timeout))
  ]).then(() => {});
}

function resetVideoSection(sectionEl) {
  if (!sectionEl) return;
  const videos = sectionEl.querySelectorAll('video');
  videos.forEach(video => {
    if (!video.paused) {
      video.pause();
    }
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  });
}

function switchTab(id, triggerEl) {
  const showSection = () => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const sectionEl = document.getElementById('section-' + id);
    if (sectionEl) sectionEl.classList.remove('video-loading');
    document.getElementById('section-' + id).classList.add('active');

    document.querySelectorAll('.hero-tagline').forEach(t => t.classList.remove('active'));
    const tagline = document.querySelector('.hero-tagline[data-tagline="' + id + '"]');
    if (tagline) tagline.classList.add('active');

    document.querySelectorAll('.nav-link, .tab-btn').forEach(b => {
      if (b.tagName === 'BUTTON') b.classList.remove('active');
    });
    if (triggerEl) {
      document.querySelectorAll('[onclick*="switchTab(\'' + id + '\'")').forEach(el => {
        el.classList.add('active');
      });
    }
  };

  if (id === 'video') {
    const sectionEl = document.getElementById('section-' + id);
    if (sectionEl) sectionEl.classList.add('video-loading');
    resetVideoSection(sectionEl);
    showSection();
    preloadSectionVideos(sectionEl).then(() => {
      if (sectionEl) sectionEl.classList.remove('video-loading');
    });
  } else {
    showSection();
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
  // delay starting incoming until outgoing has pushed left
  setTimeout(() => {
    incoming.classList.add('rw-enter');
  }, 450);

  setTimeout(() => { current.remove(); }, 950);
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
    const isLocalVideo = url.match(/\.(mp4|webm|ogv)$/i);
    if (isLocalVideo) {
      body.innerHTML = '<div class="modal-embed"><video controls autoplay playsinline src="' + url + '"></video></div>';
    } else {
      body.innerHTML = '<div class="modal-embed"><iframe src="' + url + '?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe></div>';
    }
  } else {
    body.innerHTML = '<div class="modal-placeholder"><i class="ti ti-video-off" aria-hidden="true"></i><span>Video coming soon — add a YouTube embed link or local MP4 path in script.js</span></div>';
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

function initInlineVideoControls() {
  const videoCards = document.querySelectorAll('.video-card-thumb');
  if (!videoCards.length) return;

  videoCards.forEach(videoCard => {
    const videoEl = videoCard.querySelector('video');
    const button = videoCard.querySelector('.video-play-toggle');
    if (!videoEl || !button) return;

    function updateButton() {
      button.textContent = videoEl.paused ? '▶' : '❚❚';
      button.classList.toggle('paused', videoEl.paused);
    }

    function setPosterFromFirstFrame() {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      videoEl.setAttribute('poster', dataUrl);
    }

    videoEl.addEventListener('loadeddata', () => {
      if (videoEl.readyState >= 2 && !videoEl.getAttribute('poster')) {
        setPosterFromFirstFrame();
      }
    });

    button.addEventListener('click', event => {
      event.stopPropagation();
      if (videoEl.paused) {
        videoEl.play();
      } else {
        videoEl.pause();
      }
    });

    videoEl.addEventListener('play', updateButton);
    videoEl.addEventListener('pause', updateButton);
    updateButton();
  });
}

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
  initInlineVideoControls();
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
