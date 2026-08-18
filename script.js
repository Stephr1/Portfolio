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
  'Music':             'images/covers/Music.mp4',
  'Sports':            'images/covers/Sports2.mp4',
  'Interviews':        'images/covers/Interviews.mp4',
};

/* ===== Tab switching ===== */
const VIDEO_LOADING_SCREEN_MIN_MS = 500;
const VIDEO_LOADING_SCREEN_TAB_SWITCH_MIN_MS = 1350;
const VIDEO_LOADING_SCREEN_SAFETY_MS = 2000;
const REELS_LOADING_SCREEN_MIN_MS = 1350;
const REELS_LOADING_SCREEN_SAFETY_MS = 3000;
let reelsIntroShown = false;

// Instagram embeds are cross-origin iframes, so 'load' (fired once, even
// cross-origin) is the only readiness signal available — there's no
// equivalent of a video 'playing' event to hook into.
function runReelsLoadingScreen(sectionEl) {
  if (!sectionEl) return;
  sectionEl.classList.add('reels-loading');

  const iframes = Array.from(sectionEl.querySelectorAll('iframe'));
  const loadPromises = iframes.map(iframe => new Promise(resolve => {
    const done = () => {
      iframe.removeEventListener('load', done);
      iframe.removeEventListener('error', done);
      resolve();
    };
    iframe.addEventListener('load', done);
    iframe.addEventListener('error', done);
  }));
  // Instagram embeds are network-dependent and can be slow (or blocked); don't hold the curtain forever.
  const iframesReady = Promise.race([
    Promise.all(loadPromises),
    new Promise(resolve => setTimeout(resolve, REELS_LOADING_SCREEN_SAFETY_MS))
  ]);
  const minDuration = new Promise(resolve => setTimeout(resolve, REELS_LOADING_SCREEN_MIN_MS));

  Promise.all([iframesReady, minDuration]).then(() => {
    sectionEl.classList.remove('reels-loading');
  });
}

// Resolves once `video` is actually rendering frames again. `alreadyOk` lets the
// initial page-load path treat a video that's already playing as done immediately —
// but a restart path must NOT use that shortcut, because calling play() flips
// video.paused to false synchronously, before real playback resumes, which would
// make this resolve instantly and defeat the wait.
function waitForVideoPlaying(video, { alreadyOk = false } = {}) {
  return new Promise(resolve => {
    if (alreadyOk && !video.paused && video.readyState >= 3) return resolve();
    const done = () => {
      video.removeEventListener('playing', done);
      video.removeEventListener('error', done);
      resolve();
    };
    video.addEventListener('playing', done);
    video.addEventListener('error', done);
  });
}

function runVideoLoadingScreen(sectionEl, videoReadyPromises, minDurationMs = VIDEO_LOADING_SCREEN_MIN_MS) {
  if (!sectionEl) return;
  // Videos keep playing underneath — this just covers them with an
  // opaque layer briefly so playback doesn't flash in before it settles.
  sectionEl.classList.add('videos-loading');

  // Wait for actual playback to resume, but don't let a stalled video hold the curtain forever.
  const videosReady = Promise.race([
    Promise.all(videoReadyPromises),
    new Promise(resolve => setTimeout(resolve, VIDEO_LOADING_SCREEN_SAFETY_MS))
  ]);
  const minDuration = new Promise(resolve => setTimeout(resolve, minDurationMs));

  Promise.all([videosReady, minDuration]).then(() => {
    sectionEl.classList.remove('videos-loading');
  });
}

// Pauses every video in place (keeps currentTime) instead of tearing it down,
// so there's nothing to re-buffer or re-decode when the tab is revisited.
function pauseVideoSection(sectionEl) {
  if (!sectionEl) return;
  sectionEl.querySelectorAll('video').forEach(video => {
    if (!video.paused) video.pause();
  });
}

// Resumes every video from wherever it was paused and returns a ready-promise
// per video. Listeners are attached before play() is triggered so the
// 'playing' event this resume causes can't be missed.
function resumeVideoSection(sectionEl) {
  if (!sectionEl) return [];
  const videos = Array.from(sectionEl.querySelectorAll('video'));
  return videos.map(video => {
    const ready = waitForVideoPlaying(video);
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
    return ready;
  });
}

function switchTab(id, triggerEl) {
  const showSection = () => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + id).classList.add('active');

    document.querySelectorAll('.hero-tagline').forEach(t => t.classList.remove('active'));
    const tagline = document.querySelector('.hero-tagline[data-tagline="' + id + '"]');
    if (tagline) tagline.classList.add('active');

    // clear active state from nav links and tab buttons
    document.querySelectorAll('.nav-link, .tab-btn').forEach(el => el.classList.remove('active'));
    // prefer to mark the actual clicked element active
    if (triggerEl && triggerEl.classList && triggerEl.classList.contains('tab-btn')) {
      triggerEl.classList.add('active');
    } else {
      // fallback: find any element with an onclick that calls switchTab with this id
      document.querySelectorAll('[onclick]').forEach(el => {
        const on = el.getAttribute('onclick') || '';
        if (on.indexOf("switchTab('" + id + "'") !== -1) {
          el.classList.add('active');
        }
      });
    }
  };

  const videoSection = document.getElementById('section-video');
  const isLeavingVideoTab = id !== 'video' && videoSection && videoSection.classList.contains('active');
  if (isLeavingVideoTab) {
    pauseVideoSection(videoSection);
  }

  if (id === 'video') {
    const sectionEl = videoSection;
    const alreadyOnVideoTab = sectionEl && sectionEl.classList.contains('active');
    if (alreadyOnVideoTab) {
      showSection();
      return;
    }
    // Cover with the curtain and reveal the section (still hidden behind it) BEFORE
    // touching playback — resuming a video while its container is display:none
    // decodes on a timeline disconnected from actual paint, causing staggered pop-in
    // once the section becomes visible.
    if (sectionEl) sectionEl.classList.add('videos-loading');
    showSection();
    const readyPromises = resumeVideoSection(sectionEl);
    runVideoLoadingScreen(sectionEl, readyPromises, VIDEO_LOADING_SCREEN_TAB_SWITCH_MIN_MS);
  } else if (id === 'reels' && !reelsIntroShown) {
    reelsIntroShown = true;
    const sectionEl = document.getElementById('section-reels');
    if (sectionEl) sectionEl.classList.add('reels-loading');
    showSection();
    runReelsLoadingScreen(sectionEl);
  } else {
    showSection();
  }
}

// The video tab is active by default on page load, so run the same
// loading screen there rather than only on subsequent tab switches.
document.addEventListener('DOMContentLoaded', () => {
  const initialVideoSection = document.getElementById('section-video');
  if (initialVideoSection && initialVideoSection.classList.contains('active')) {
    const videos = Array.from(initialVideoSection.querySelectorAll('video'));
    const readyPromises = videos.map(video => waitForVideoPlaying(video, { alreadyOk: true }));
    runVideoLoadingScreen(initialVideoSection, readyPromises);
  }
});

/* ===== Media training skill tabs ===== */
function selectMediaSkill(triggerEl) {
  document.querySelectorAll('.mediatraining-skill-tab').forEach(el => el.classList.remove('active'));
  triggerEl.classList.add('active');
  const panel = document.getElementById('mediatraining-skill-panel');
  if (panel) panel.textContent = triggerEl.dataset.desc;
}

function selectCameraSkill(triggerEl) {
  document.querySelectorAll('.cameralessons-skill-tab').forEach(el => el.classList.remove('active'));
  triggerEl.classList.add('active');
  const panel = document.getElementById('cameralessons-skill-panel');
  if (panel) panel.textContent = triggerEl.dataset.desc;
}

/* ===== Hero rotating words ===== */
const photoWords = ['Memories', 'Atmosphere', 'Product', 'Attractive Side', 'Talent'];
const videoWords = ['Customers', 'Audience', 'Voters', 'Target Demographic'];
const reelsWords = ['Funny', 'Informative', 'Exciting', 'Nostalgic'];

let photoIdx = 0, videoIdx = 0, reelsIdx = 0;

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

  // Keep the incoming hidden (rw-enter-start) until the outgoing has animated out.
  incoming.classList.remove('rw-no-transition');
  // ensure any enter animation class is removed so exit animation runs consistently
  current.classList.remove('rw-enter');
  current.classList.add('rw-exit');
  // start the incoming animation after the exit duration
  const exitMs = 700; // matches slide animation length in CSS
  setTimeout(() => {
    incoming.classList.remove('rw-enter-start');
    incoming.classList.add('rw-enter');
  }, exitMs);

  // remove the old element right after the fade completes
  setTimeout(() => { current.remove(); }, exitMs + 20);
  return nextIdx;
}

setInterval(() => { photoIdx = cycleWord('photo-word', photoWords, photoIdx); }, 3200);
setInterval(() => { videoIdx = cycleWord('video-word', videoWords, videoIdx); }, 3000);
setInterval(() => { reelsIdx = cycleWord('reels-word', reelsWords, reelsIdx); }, 3000);

// Ensure initial words animate the same as incoming words
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.rotate-word-wrap .rotate-word').forEach(el => {
    // add the enter class so the starting word uses the same animation baseline
    if (!el.classList.contains('rw-enter')) el.classList.add('rw-enter');
  });
});

/* ===== Video modal ===== */
function openVideoModal(title, embedUrl) {
  const backdrop = document.getElementById('video-modal');
  document.getElementById('modal-title-text').textContent = title;
  const body = document.getElementById('modal-body');
  const url = embedUrl || VIDEO_EMBEDS[title] || '';

  if (url) {
    const isLocalVideo = url.match(/\.(mp4|webm|ogv)$/i);
    const isInstagram = url.match(/instagram\.com\/(p|reel)\/([^\/\?#]+)/i);
    if (isLocalVideo) {
      body.innerHTML = '<div class="modal-embed"><video controls autoplay playsinline src="' + url + '"></video></div>';
    } else if (isInstagram) {
      // Use Instagram's embed URL for the post/reel
      const postType = isInstagram[1];
      const shortcode = isInstagram[2];
      const iframeSrc = 'https://www.instagram.com/' + postType + '/' + shortcode + '/embed/';
      body.innerHTML = '<div class="modal-embed"><iframe src="' + iframeSrc + '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen frameborder="0"></iframe></div>';
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

const animalImages = Array.from({ length: 4 }, (_, index) => `images/covers/animal-${index + 1}.png`);
const animalCaptions = Array.from({ length: 4 }, () => '');
let currentAnimalIndex = 0;

function showAnimalPhoto() {
  const img = document.getElementById('animal-carousel-img');
  const caption = document.getElementById('animal-caption');
  if (!img) return;
  img.src = animalImages[currentAnimalIndex];
  img.alt = `Animal photo ${currentAnimalIndex + 1}`;
  if (caption) {
    caption.textContent = animalCaptions[currentAnimalIndex] || '';
    caption.style.display = animalCaptions[currentAnimalIndex] ? 'block' : 'none';
  }
}

function changeAnimalPhoto(direction) {
  currentAnimalIndex = (currentAnimalIndex + direction + animalImages.length) % animalImages.length;
  showAnimalPhoto();
}

/* ===== Wire up all booking buttons ===== */
document.addEventListener('DOMContentLoaded', () => {
  showNightlifePhoto();
  showCorporatePhoto();
  showPortraitPhoto();
  showProposalPhoto();
  showSportsPhoto();
  showAnimalPhoto();
  initInlineVideoControls();
  document.querySelectorAll('[href*="YOUR_SCHEDULE_ID"]').forEach(el => {
    el.href = BOOKING_LINK;
  });
});
// --- Reel activation: enable iframe interaction on user activation ---
// Removed activation overlay: iframes are interactive by default.
// Ensure Instagram embeds are processed so they render correctly
document.addEventListener('DOMContentLoaded', function () {
  try {
    if (window.instgrm && instgrm.Embeds && typeof instgrm.Embeds.process === 'function') {
      instgrm.Embeds.process();
    }
  } catch (e) {
    // ignore
  }
});

/* ===== Header shadow once the page scrolls out from under it ===== */
const headerBar = document.querySelector('.site-header-bar');
if (headerBar) {
  window.addEventListener('scroll', () => {
    headerBar.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });
}
