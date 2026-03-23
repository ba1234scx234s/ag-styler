const STYLE_ID = 'ag-styler-overrides';
const AG_ATTR = 'data-ag-cs'; // marks elements we've colour-modified

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

// All colour-bearing CSS properties to check
const COLOR_PROPS = [
  'color', 'background-color',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'text-decoration-color', 'caret-color', 'column-rule-color',
  'fill', 'stroke'
];

function buildFontCSS() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');

*:not([class*="material-symbols"]):not([class*="material-icons"]):not([class*="font-awesome"]):not([class*="fa "]):not([class*="fa-"]):not([class^="icon-"]):not([class*=" icon-"]) {
  font-family: Manrope, sans-serif !important;
}
[style*="Open Sans"], [class*="open-sans"], [class*="opensans"] {
  font-family: Manrope, sans-serif !important;
}
/* Restore icon fonts — revert lets the page's own stylesheet value win */
[class*="material-symbols"],
[class*="material-icons"],
[class^="icon-"],
[class*=" icon-"] {
  font-family: revert !important;
}
`;
}

let colorObserver = null;

function clearColorOverrides() {
  if (colorObserver) { colorObserver.disconnect(); colorObserver = null; }
  document.querySelectorAll(`[${AG_ATTR}]`).forEach(el => {
    COLOR_PROPS.forEach(prop => el.style.removeProperty(prop));
    el.removeAttribute(AG_ATTR);
  });
}

function processElement(el, validSwaps) {
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
  if (hit) el.setAttribute(AG_ATTR, '1');
}

function applyColorSwaps(swaps) {
  clearColorOverrides();
  if (!swaps || !swaps.length) return;

  const validSwaps = swaps
    .filter(s => s.from && s.to)
    .map(s => ({ rgb: hexToRgbParts(s.from), to: s.to }))
    .filter(s => s.rgb);

  if (!validSwaps.length) return;

  // Scan every rendered element
  document.querySelectorAll('*').forEach(el => processElement(el, validSwaps));

  // Catch dynamically added elements
  colorObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type !== 'childList') continue;
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        processElement(node, validSwaps);
        node.querySelectorAll('*').forEach(el => processElement(el, validSwaps));
      });
    }
  });
  colorObserver.observe(document.documentElement, { childList: true, subtree: true });
}

function applyStyles(settings) {
  let el = document.getElementById(STYLE_ID);

  if (!settings.enabled) {
    if (el) el.remove();
    clearColorOverrides();
    return;
  }

  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = settings.fontEnabled ? buildFontCSS() : '';

  // Wait for DOM to be painted before scanning computed styles
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyColorSwaps(settings.colorSwaps), { once: true });
  } else {
    applyColorSwaps(settings.colorSwaps);
  }
}

chrome.storage.sync.get(['agStylerSettings'], (result) => {
  const settings = result.agStylerSettings || { enabled: true, fontEnabled: true, colorSwaps: [] };
  applyStyles(settings);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'AG_STYLER_UPDATE') applyStyles(msg.settings);
});
