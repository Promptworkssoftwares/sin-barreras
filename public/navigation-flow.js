const DEFAULT_DELAY = 60;
const PULSE_CLASS = 'guided-flow-target';
let pulseTimer = null;

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

function safeElement(target) {
  if (!target) return null;
  if (typeof target === 'string') return document.querySelector(target);
  return typeof Element !== 'undefined' && target instanceof Element ? target : null;
}

function viewportInsets() {
  const topbar = document.querySelector('.topbar');
  const bottomNav = document.querySelector('.bottom-nav');
  const top = Math.max(16, (topbar?.getBoundingClientRect().height || 0) + 16);
  const bottom = Math.max(20, (bottomNav?.getBoundingClientRect().height || 0) + 22);
  return { top, bottom };
}

function isComfortablyVisible(element) {
  const rect = element.getBoundingClientRect();
  const { top, bottom } = viewportInsets();
  const viewportBottom = window.innerHeight - bottom;
  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, top));
  const requiredHeight = Math.min(rect.height || 1, Math.max(80, window.innerHeight * 0.28));
  return rect.top >= top && rect.bottom <= viewportBottom && visibleHeight >= requiredHeight;
}

function pulse(element) {
  if (!element || prefersReducedMotion()) return;
  if (pulseTimer) window.clearTimeout(pulseTimer);
  document.querySelectorAll(`.${PULSE_CLASS}`).forEach((node) => node.classList.remove(PULSE_CLASS));
  element.classList.add(PULSE_CLASS);
  pulseTimer = window.setTimeout(() => element.classList.remove(PULSE_CLASS), 1150);
}

export function guidedScroll(target, {
  block = 'center',
  force = false,
  highlight = true,
  delay = DEFAULT_DELAY,
  focus = false
} = {}) {
  const element = safeElement(target);
  if (!element || element.closest('.is-hidden,[hidden]')) return false;

  const run = () => {
    if (!element.isConnected || element.closest('.is-hidden,[hidden]')) return;
    const shouldMove = force || !isComfortablyVisible(element);
    if (shouldMove) {
      element.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block,
        inline: 'nearest'
      });
    }
    if (highlight) pulse(element);
    if (focus && typeof element.focus === 'function') {
      window.setTimeout(() => element.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 280);
    }
  };

  window.setTimeout(() => window.requestAnimationFrame(run), Math.max(0, delay));
  return true;
}

export function guidedTop(target, options = {}) {
  return guidedScroll(target, { block: 'start', ...options });
}
