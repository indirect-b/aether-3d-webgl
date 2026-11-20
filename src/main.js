import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Experience from './scene/Experience.js';
import SoundEngine from './utils/Sound.js';
import MagneticCursor from './utils/Cursor.js';
import TiltCards from './utils/TiltCards.js';
import './styles/main.css';
import projects from './assets/data/projects.json';

// ─── Register GSAP Plugins ──────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ─── Initialize Active Theory Audio & Interactions ─────────
const sound = new SoundEngine();
const cursor = new MagneticCursor(sound);
const tiltCards = new TiltCards();

// ─── Lenis Smooth Scroll ────────────────────────────────────
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  touchMultiplier: 1.4,
});

// Synchronize Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ─── Three.js Experience ────────────────────────────────────
const canvas = document.getElementById('webgl-canvas');
const experience = new Experience(canvas);

// ─── Scroll Synchronization & Fluid Ripple Velocity ────────
function getScrollMetrics() {
  const content = document.querySelector('.scroll-content');
  const scrollHeight = content ? content.scrollHeight : document.body.scrollHeight;
  const maxScroll = Math.max(scrollHeight - window.innerHeight, 1);
  return { maxScroll };
}

let scrollMetrics = getScrollMetrics();
window.addEventListener('resize', () => {
  scrollMetrics = getScrollMetrics();
  ScrollTrigger.refresh();
  cursor.refreshInteractives();
});

lenis.on('scroll', ({ scroll, velocity }) => {
  const progress = Math.min(Math.max(scroll / scrollMetrics.maxScroll, 0), 1);
  experience.setScrollProgress(progress);

  // Feed scroll velocity to fluid distortion pass and audio filter
  experience.setScrollVelocity(velocity);
  sound.setScrollVelocity(velocity);
});

// ─── Canvas Entrance Animation ─────────────────────────────
gsap.fromTo(
  canvas,
  { opacity: 0 },
  { opacity: 1, duration: 2.2, ease: 'power2.out' }
);

// ─── Active Theory Editorial Section Reveals ───────────────
const sections = document.querySelectorAll('.section');

sections.forEach((section, index) => {
  const badge = section.querySelector('.tag-badge');
  const title = section.querySelector('.hero-title, .section-title');
  const lead = section.querySelector('.lead-text');
  const cards = section.querySelectorAll('.glass-card');
  const indicator = section.querySelector('.scroll-indicator');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 85%',
      end: 'top 30%',
      toggleActions: 'play none none reverse',
    },
  });

  if (badge) {
    tl.fromTo(
      badge,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );
  }

  if (title) {
    tl.fromTo(
      title,
      { y: 44, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.4'
    );
  }

  if (lead) {
    tl.fromTo(
      lead,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
      '-=0.5'
    );
  }

  if (cards.length > 0) {
    tl.fromTo(
      cards,
      { y: 36, opacity: 0, scale: 0.94 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.14,
        ease: 'back.out(1.2)',
      },
      '-=0.4'
    );
  }

  if (indicator && index === 0) {
    gsap.to(indicator, {
      opacity: 0,
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom 80%',
        scrub: true,
      },
    });
  }
});

// ─── Floating Dock Controls ─────────────────────────────────
const btnBloom = document.getElementById('btn-bloom');
const btnWireframe = document.getElementById('btn-wireframe');
const btnPalette = document.getElementById('btn-palette');
const paletteLabel = document.getElementById('palette-label');
const btnResetCam = document.getElementById('btn-reset-cam');

if (btnBloom) {
  btnBloom.addEventListener('click', () => {
    const isBloomOn = experience.toggleBloom();
    btnBloom.classList.toggle('active', isBloomOn);
  });
}

if (btnWireframe) {
  btnWireframe.addEventListener('click', () => {
    const isWire = experience.toggleWireframe();
    btnWireframe.classList.toggle('active', isWire);
  });
}

if (btnPalette) {
  btnPalette.addEventListener('click', () => {
    const pal = experience.cyclePalette();
    if (paletteLabel) {
      paletteLabel.textContent = pal.name;
    }
  });
}

if (btnResetCam) {
  btnResetCam.addEventListener('click', () => {
    experience.resetCamera();
  });
}

// ─── Sound Toggle Controller ────────────────────────────────
const btnSound = document.getElementById('btn-sound');
const soundLabel = document.getElementById('sound-label');

if (btnSound) {
  btnSound.addEventListener('click', () => {
    const isPlaying = sound.toggle();
    btnSound.classList.toggle('is-active', isPlaying);
    if (soundLabel) {
      soundLabel.textContent = isPlaying ? 'SOUND // ON' : 'SOUND // OFF';
    }
  });
}

// ─── Technical World Clocks (LAX, AMS, TYO) ─────────────────
const clockLax = document.getElementById('clock-lax');
const clockAms = document.getElementById('clock-ams');
const clockTyo = document.getElementById('clock-tyo');

const formatTimeForZone = (timeZone) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return '--:--';
  }
};

const updateClocks = () => {
  if (clockLax) clockLax.textContent = formatTimeForZone('America/Los_Angeles');
  if (clockAms) clockAms.textContent = formatTimeForZone('Europe/Amsterdam');
  if (clockTyo) clockTyo.textContent = formatTimeForZone('Asia/Tokyo');
};
updateClocks();
setInterval(updateClocks, 1000);

// ─── Cursor Coordinates Telemetry ───────────────────────────
const cursorCoordVal = document.querySelector('#cursor-coords .coord-val');
window.addEventListener('mousemove', (e) => {
  if (cursorCoordVal) {
    const normX = ((e.clientX / window.innerWidth) * 2 - 1).toFixed(2);
    const normY = (-(e.clientY / window.innerHeight) * 2 + 1).toFixed(2);
    const signX = normX >= 0 ? '+' : '';
    const signY = normY >= 0 ? '+' : '';
    cursorCoordVal.textContent = `[${signX}${normX}, ${signY}${normY}]`;
  }
});

// ─── Live FPS Counter ───────────────────────────────────────
const fpsCounter = document.getElementById('active-fps');
if (fpsCounter) {
  let frameCount = 0;
  let lastTime = performance.now();

  const updateFPS = () => {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fpsCounter.textContent = Math.round((frameCount * 1000) / (now - lastTime));
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(updateFPS);
  };
  requestAnimationFrame(updateFPS);
}

console.log('⚡ Active Theory Experience Initialized');
