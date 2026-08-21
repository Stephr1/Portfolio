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
  // Home page featured video — leave blank until a real file/link exists;
  // the modal shows a "coming soon" placeholder for an empty entry.
  'Working With Me':   '',
};

/* ===== Tab switching ===== */
const VIDEO_LOADING_SCREEN_MIN_MS = 500;
const VIDEO_LOADING_SCREEN_TAB_SWITCH_MIN_MS = 1350;
const VIDEO_LOADING_SCREEN_SAFETY_MS = 2000;

// Videos are paused-in-place (not torn down) when leaving the panel, so once
// they've proven they can reach 'playing' at least once, resuming again is
// instant — no buffering to hide. Only the first time (an unusually fast
// first switch) still needs the longer curtain.
let videographyEverReady = false;

// Resolves once `video` is actually rendering frames again. `alreadyOk` lets an
// already-playing video (checked via `!video.paused && readyState>=3`) resolve
// immediately — but a restart path must NOT use that shortcut, because calling
// play() flips video.paused to false synchronously, before real playback
// resumes, which would make this resolve instantly and defeat the wait.
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
// so there's nothing to re-buffer or re-decode when the panel is revisited.
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

// Shared by both the top-level switchTab (entering Content Production while
// its Videography sub-tab is the one that's active) and switchProductionTab
// (switching directly to the Videography sub-tab) — same curtain/readiness
// behavior either way.
function enterVideographyPlayback(panel) {
  const readyPromises = resumeVideoSection(panel);
  const minDuration = videographyEverReady ? VIDEO_LOADING_SCREEN_MIN_MS : VIDEO_LOADING_SCREEN_TAB_SWITCH_MIN_MS;
  runVideoLoadingScreen(panel, readyPromises, minDuration);
  Promise.all(readyPromises).then(() => { videographyEverReady = true; });
  // The Videography panel starts hidden (display:none) at page load, so the
  // first-frame poster capture in initInlineVideoControls may not have had
  // real decoded frames to grab yet. Re-running it (idempotent — guarded by
  // data-controls-wired) once the panel is actually visible catches that.
  initInlineVideoControls();
}

function switchTab(id, triggerEl) {
  const showSection = () => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + id).classList.add('active');

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

  const videographyPanel = document.getElementById('panel-videography');
  const isLeavingVideography = id !== 'content-production' && videographyPanel && videographyPanel.classList.contains('active');
  if (isLeavingVideography) {
    pauseVideoSection(videographyPanel);
  }

  if (id === 'reels') loadReelsIfNeeded();

  // Entering Content Production while its remembered active sub-tab happens
  // to be Videography needs the same "curtain up, reveal, resume" sequencing
  // as switching sub-tabs directly — but only the FIRST time (if Content
  // Production is already the active top-level section, this is a no-op
  // re-click and playback is already running, so skip it).
  const enteringVideographyFresh = id === 'content-production'
    && videographyPanel && videographyPanel.classList.contains('active')
    && !document.getElementById('section-content-production').classList.contains('active');

  if (enteringVideographyFresh) videographyPanel.classList.add('videos-loading');
  showSection();
  if (enteringVideographyFresh) enterVideographyPlayback(videographyPanel);
}

/* ===== Content Production sub-tabs ===== */
function switchProductionTab(id, triggerEl) {
  const container = document.getElementById('section-content-production');
  if (!container) return;

  const showPanel = () => {
    container.querySelectorAll('.production-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('panel-' + id);
    if (panel) panel.classList.add('active');

    container.querySelectorAll('.production-tab').forEach(t => t.classList.remove('active'));
    if (triggerEl && triggerEl.classList && triggerEl.classList.contains('production-tab')) {
      triggerEl.classList.add('active');
    } else {
      container.querySelectorAll('[onclick]').forEach(el => {
        const on = el.getAttribute('onclick') || '';
        if (on.indexOf("switchProductionTab('" + id + "'") !== -1) {
          el.classList.add('active');
        }
      });
    }
  };

  const videographyPanel = document.getElementById('panel-videography');
  const isLeavingVideography = id !== 'videography' && videographyPanel && videographyPanel.classList.contains('active');
  if (isLeavingVideography) {
    pauseVideoSection(videographyPanel);
  }

  if (id === 'videography') {
    const alreadyOnVideography = videographyPanel && videographyPanel.classList.contains('active');
    if (alreadyOnVideography) {
      showPanel();
      return;
    }
    if (videographyPanel) videographyPanel.classList.add('videos-loading');
    showPanel();
    enterVideographyPlayback(videographyPanel);
  } else {
    showPanel();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
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
  if (panel) panel.innerHTML = triggerEl.dataset.desc;
}

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
    if (videoCard.dataset.controlsWired) return;
    videoCard.dataset.controlsWired = 'true';

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

/* ===== Photo carousels ===== */
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

const corporateImages = [1, 4, 5, 6, 7, 8, 9].map(n => `images/covers/Corperate-${n}.png`);
const corporateCaptions = corporateImages.map(() => '');
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

/* ===== Reels: lazy-load Instagram embeds only once the Reels tab is
   actually opened (it now lives in the footer, not the main nav, so most
   visitors never click it — no point paying the embed.js + 8-iframe cost
   on every single page load, including the Home page's first impression). ===== */
let reelsLoaded = false;
function loadReelsIfNeeded() {
  if (reelsLoaded) return;
  reelsLoaded = true;
  document.querySelectorAll('#section-reels iframe[data-src]').forEach(iframe => {
    iframe.src = iframe.dataset.src;
    iframe.removeAttribute('data-src');
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.instagram.com/embed.js';
  script.onload = () => {
    try {
      if (window.instgrm && instgrm.Embeds && typeof instgrm.Embeds.process === 'function') {
        instgrm.Embeds.process();
      }
    } catch (e) {
      // ignore
    }
  };
  document.body.appendChild(script);
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

/* ===== Header shadow once the page scrolls out from under it ===== */
const headerBar = document.querySelector('.site-header-bar');
if (headerBar) {
  window.addEventListener('scroll', () => {
    headerBar.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });
}

/* ===== Wave banner: a single bounce sweeps left-to-right across the text,
   then waits a random 3-10s pause (measured from when it finishes) before
   sweeping again. ===== */
const WAVE_LETTER_BOUNCE_S = 0.3;
const WAVE_SWEEP_DURATION_S = 0.7;
const WAVE_PAUSE_MIN_S = 1.5;
const WAVE_PAUSE_MAX_S = 4;
const WAVE_FIRST_RUN_DELAY_S = 2;
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.wave-banner').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    const letters = Array.from(text).map(ch => {
      const span = document.createElement('span');
      span.className = 'wave-letter';
      // A regular space as the sole content of an inline-block span can get
      // collapsed to zero width by whitespace-collapsing rules — a
      // non-breaking space renders reliably instead.
      span.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(span);
      return span;
    });
    if (reduceMotion || !letters.length) return;

    const sweepMs = WAVE_SWEEP_DURATION_S * 1000;
    const letterMs = WAVE_LETTER_BOUNCE_S * 1000;
    const perLetterDelay = letters.length > 1 ? sweepMs / (letters.length - 1) : 0;

    const bounceLetter = (span, delay) => {
      span.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-5px)', offset: 0.5 },
          { transform: 'translateY(0)' }
        ],
        { duration: letterMs, delay, easing: 'ease-in-out' }
      );
    };

    const oneWayMs = (letters.length - 1) * perLetterDelay + letterMs;

    const runSweep = () => {
      // There: left to right.
      letters.forEach((span, i) => bounceLetter(span, i * perLetterDelay));
      // Back: right to left, starting once the rightmost letter has landed.
      letters.forEach((span, i) => bounceLetter(span, oneWayMs + (letters.length - 1 - i) * perLetterDelay));

      const totalMs = oneWayMs * 2;
      const pauseMs = (WAVE_PAUSE_MIN_S + Math.random() * (WAVE_PAUSE_MAX_S - WAVE_PAUSE_MIN_S)) * 1000;
      setTimeout(runSweep, totalMs + pauseMs);
    };

    // Wait until the tab this banner lives on is actually opened (rather
    // than sweeping away unseen in the background from page load), then
    // give it a beat before the first wave plays.
    const section = el.closest('.section');
    const startFirstRun = () => setTimeout(runSweep, WAVE_FIRST_RUN_DELAY_S * 1000);
    if (!section || section.classList.contains('active')) {
      startFirstRun();
    } else {
      const observer = new MutationObserver(() => {
        if (section.classList.contains('active')) {
          observer.disconnect();
          startFirstRun();
        }
      });
      observer.observe(section, { attributes: true, attributeFilter: ['class'] });
    }
  });
});
