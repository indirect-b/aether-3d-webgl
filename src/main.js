import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Experience from './scene/Experience.js';
import './styles/main.css';

// ─── Register GSAP Plugins ──────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ─── Lenis Smooth Scroll ────────────────────────────────────
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  touchMultiplier: 1.5,
});

// Synchronize Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ─── Three.js Experience ────────────────────────────────────
const canvas = document.getElementById('webgl-canvas');
const experience = new Experience(canvas);

// ─── Scroll-driven 3D Scene Synchronisation ────────────────
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
});

lenis.on('scroll', ({ scroll }) => {
  const progress = Math.min(Math.max(scroll / scrollMetrics.maxScroll, 0), 1);
  experience.setScrollProgress(progress);
});

// ─── Canvas Entrance Animation ─────────────────────────────
gsap.fromTo(
  canvas,
  { opacity: 0 },
  { opacity: 1, duration: 2.0, ease: 'power2.out' }
);

// ─── Editorial Section Animations ──────────────────────────
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
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );
  }

  if (title) {
    tl.fromTo(
      title,
      { y: 40, opacity: 0 },
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
      { y: 35, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
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

// ─── FPS Counter ────────────────────────────────────────────
const fpsCounter = document.getElementById('fps-counter');
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

console.log('✨ Aether Generative 3D Experience Initialized');
