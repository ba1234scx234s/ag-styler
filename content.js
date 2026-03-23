const STYLE_ID = 'ag-styler-import';  // just holds the @import for Manrope
const AG_FONT_ATTR = 'data-ag-font';
const AG_COLOR_ATTR = 'data-ag-cs';

function normalizeHex(hex) {
  return hex.trim().replace(/^#/, '').toLowerCase();
}

function hexToRgbParts(hex) {
  const h = normalizeHex(hex);
  if (h.length === 3) {
    return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
  }
  if (h.length === 6) {
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  return null;
}

function rgbMatches(val, [r, g, b]) {
  const m = val.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  return m && +m[1] === r && +m[2] === g && +m[3] === b;
}

const COLOR_PROPS = [
  'color', 'background-color',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'text-decoration-color', 'caret-color', 'column-rule-color',
  'fill', 'stroke'
];

// ── Font swap ────────────────────────────────────────────────────────────────

let fontObserver = null;

function clearFontOverrides() {
  if (fontObserver) { fontObserver.disconnect(); fontObserver = null; }
  document.querySelectorAll(`[${AG_FONT_ATTR}]`).forEach(el => {
    el.style.removeProperty('font-family');
    el.removeAttribute(AG_FONT_ATTR);
  });
}

function processFontElement(el) {
  if (!el || el.nodeType !== 1) return;
  const font = window.getComputedStyle(el).getPropertyValue('font-family');
  if (font && font.toLowerCase().includes('open sans')) {
    el.style.setProperty('font-family', 'Manrope, sans-serif', 'important');
    el.setAttribute(AG_FONT_ATTR, '1');
  }
}

function applyFontSwap() {
  clearFontOverrides();
  document.querySelectorAll('*').forEach(processFontElement);

  fontObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type !== 'childList') continue;
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        processFontElement(node);
        node.querySelectorAll('*').forEach(processFontElement);
      });
    }
  });
  fontObserver.observe(document.documentElement, { childList: true, subtree: true });
}

// ── Colour swap ──────────────────────────────────────────────────────────────

let colorObserver = null;

function clearColorOverrides() {
  if (colorObserver) { colorObserver.disconnect(); colorObserver = null; }
  document.querySelectorAll(`[${AG_COLOR_ATTR}]`).forEach(el => {
    COLOR_PROPS.forEach(prop => el.style.removeProperty(prop));
    el.removeAttribute(AG_COLOR_ATTR);
  });
}

function processColorElement(el, validSwaps) {
  if (!el || el.nodeType !== 1 || el.id === STYLE_ID) return;
  const computed = window.getComputedStyle(el);
  let hit = false;
  for (const swap of validSwaps) {
    for (const prop of COLOR_PROPS) {
      const val = computed.getPropertyValue(prop);
      if (val && rgbMatches(val, swap.rgb)) {
        el.style.setProperty(prop, '#' + normalizeHex(swap.to), 'important');
        hit = true;
      }
    }
  }
  if (hit) el.setAttribute(AG_COLOR_ATTR, '1');
}

function applyColorSwaps(swaps) {
  clearColorOverrides();
  if (!swaps || !swaps.length) return;

  const validSwaps = swaps
    .filter(s => s.from && s.to)
    .map(s => ({ rgb: hexToRgbParts(s.from), to: s.to }))
    .filter(s => s.rgb);

  if (!validSwaps.length) return;

  document.querySelectorAll('*').forEach(el => processColorElement(el, validSwaps));

  colorObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type !== 'childList') continue;
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        processColorElement(node, validSwaps);
        node.querySelectorAll('*').forEach(el => processColorElement(el, validSwaps));
      });
    }
  });
  colorObserver.observe(document.documentElement, { childList: true, subtree: true });
}

// ── Entry point ──────────────────────────────────────────────────────────────

function ensureManropeImport() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');`;
  (document.head || document.documentElement).appendChild(el);
}

function applyStyles(settings) {
  if (!settings.enabled) {
    clearFontOverrides();
    clearColorOverrides();
    return;
  }

  ensureManropeImport();

  const run = () => {
    if (settings.fontEnabled) applyFontSwap();
    else clearFontOverrides();
    applyColorSwaps(settings.colorSwaps);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}

chrome.storage.sync.get(['agStylerSettings'], (result) => {
  const settings = result.agStylerSettings || { enabled: true, fontEnabled: true, colorSwaps: [] };
  applyStyles(settings);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'AG_STYLER_UPDATE') applyStyles(msg.settings);
});
