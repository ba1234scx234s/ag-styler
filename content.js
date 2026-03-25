const STYLE_ID = 'ag-styler-import';  // just holds the @import for Manrope
const RADIUS_STYLE_ID = 'ag-styler-radius';
const HEADER_STYLE_ID = 'ag-styler-header';
const PAGE_BG_STYLE_ID = 'ag-styler-pagebg';
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

let currentFontFamily = 'Manrope, sans-serif';

function processFontElement(el) {
  if (!el || el.nodeType !== 1) return;
  const font = window.getComputedStyle(el).getPropertyValue('font-family');
  if (font && font.toLowerCase().includes('open sans')) {
    el.style.setProperty('font-family', currentFontFamily, 'important');
    el.setAttribute(AG_FONT_ATTR, '1');
  }
}

function applyFontSwap(selectedFont) {
  currentFontFamily = (FONT_CONFIG[selectedFont] || FONT_CONFIG['manrope']).family;
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

// ── Button radius ─────────────────────────────────────────────────────────────

function applyButtonRadius(px) {
  let el = document.getElementById(RADIUS_STYLE_ID);
  if (!px && px !== 0) {
    if (el) el.remove();
    return;
  }
  const val = parseInt(px, 10) + 'px';
  if (!el) {
    el = document.createElement('style');
    el.id = RADIUS_STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = `button, [role="button"], a[class*="btn"], input[type="button"], input[type="submit"], input[type="reset"] { border-radius: ${val} !important; }`;
}

// ── Header styles ─────────────────────────────────────────────────────────────

function applyHeaderStyles(header, logo) {
  let el = document.getElementById(HEADER_STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = HEADER_STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  const h = header || {};
  const rules = [
    `.header, .header__brand { border-right-width: 0 !important; }`,
    `.header.navbar-fixed-top { border-bottom-width: 0 !important; }`,
    logo
      ? `.header__brand { background-image: url("${logo}") !important; background-size: ${h.logoSize || 100}% !important; background-repeat: no-repeat !important; background-position: center !important; }`
      : `.header__brand { background-image: none !important; }`,
    `.discover-listings-header .header { border-right-width: revert !important; }`
  ];
  if (h.bgColor) {
    rules.push(`.header { background-color: #${normalizeHex(h.bgColor)} !important; }`);
    rules.push(`.discover-listings-header .header { background-color: revert !important; }`);
  }
  if (h.linkColor) {
    const lc = '#' + normalizeHex(h.linkColor);
    rules.push(`.header a, .header button, .header [role="button"] { color: ${lc} !important; }`);
    rules.push(`.header a *, .header button *, .header [role="button"] * { color: inherit !important; }`);
    rules.push(`.discover-listings-header .header a, .discover-listings-header .header button, .discover-listings-header .header [role="button"] { color: revert !important; }`);
  }
  el.textContent = rules.join('\n');
}

// ── Navigation styles ─────────────────────────────────────────────────────────

const NAV_STYLE_ID = 'ag-styler-nav';

function applyNavStyles(nav) {
  let el = document.getElementById(NAV_STYLE_ID);
  const n = nav || {};
  const rules = [];
  if (n.sidebarBg) rules.push(`.seamless-sidebar { background-color: #${normalizeHex(n.sidebarBg)} !important; }`);
  if (n.linkColor)  rules.push(`.seamless { color: #${normalizeHex(n.linkColor)} !important; }`);
  if (n.activeBg)   rules.push(`.seamless.selected { background-color: #${normalizeHex(n.activeBg)} !important; }`);
  if (n.hoverBg)    rules.push(`.seamless:not(.selected):hover, .seamless.panel-open { background-color: #${normalizeHex(n.hoverBg)} !important; }`);

  if (!rules.length) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('style');
    el.id = NAV_STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = rules.join('\n');
}

// ── Page background ───────────────────────────────────────────────────────────

function applyPageBg(hex) {
  let el = document.getElementById(PAGE_BG_STYLE_ID);
  if (!hex) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('style');
    el.id = PAGE_BG_STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = `:root { --bs-body-bg: #${normalizeHex(hex)} !important; } body { background-color: #${normalizeHex(hex)} !important; }`;
}

// ── Entry point ──────────────────────────────────────────────────────────────

const FONT_CONFIG = {
  'manrope':  {
    import: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');`,
    family: 'Manrope, sans-serif'
  },
  'atkinson': {
    import: `@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap');`,
    family: '"Atkinson Hyperlegible", sans-serif'
  },
  'inter': {
    import: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');`,
    family: 'Inter, sans-serif'
  },
  'comic-sans': {
    import: '',
    family: '"Comic Sans MS", "Comic Sans", cursive'
  }
};

function ensureFontImport(selectedFont) {
  const config = FONT_CONFIG[selectedFont];
  let el = document.getElementById(STYLE_ID);
  if (!config) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = config.import;
}

function applyStyles(settings, logo) {
  if (!settings.enabled) {
    clearFontOverrides();
    clearColorOverrides();
    applyButtonRadius(null);
    applyPageBg(null);
    const hdrEl = document.getElementById(HEADER_STYLE_ID);
    if (hdrEl) hdrEl.remove();
    const navEl = document.getElementById(NAV_STYLE_ID);
    if (navEl) navEl.remove();
    return;
  }

  ensureFontImport(settings.selectedFont);

  const run = () => {
    if (settings.selectedFont && settings.selectedFont !== 'open-sans') applyFontSwap(settings.selectedFont);
    else clearFontOverrides();
    applyColorSwaps(settings.colorSwaps);
    applyButtonRadius(settings.buttonRadius);
    applyPageBg(settings.pageBgColor || '');
    applyHeaderStyles(settings.header || {}, logo || '');
    applyNavStyles(settings.nav || {});
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}

chrome.storage.sync.get(['agStylerSettings'], (result) => {
  const saved = result.agStylerSettings || {};
  if (!saved.selectedFont) {
    saved.selectedFont = saved.fontEnabled === false ? 'open-sans' : 'manrope';
  }
  const settings = { enabled: true, selectedFont: 'open-sans', colorSwaps: [], ...saved };
  chrome.storage.local.get(['agStylerLogo'], (local) => {
    applyStyles(settings, local.agStylerLogo || '');
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'AG_STYLER_UPDATE') applyStyles(msg.settings, msg.logo || '');
});
