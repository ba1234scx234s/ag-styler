const STYLE_ID = 'ag-styler-overrides';

function normalizeHex(hex) {
  return hex.trim().replace(/^#/, '').toLowerCase();
}

function buildFontCSS() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');

*:not([class*="material-symbols"]):not([class*="material-icons"]):not([class*="font-awesome"]):not([class*="fa "]):not([class*="fa-"]) {
  font-family: Manrope, sans-serif !important;
}
[style*="Open Sans"], [class*="open-sans"], [class*="opensans"] {
  font-family: Manrope, sans-serif !important;
}
/* Explicitly restore icon fonts so the :not() rule above can't bleed in */
[class*="material-symbols"],
[class*="material-icons"] {
  font-family: 'Material Symbols Rounded', 'Material Symbols Outlined',
               'Material Icons', 'Material Icons Round', 'Material Icons Outlined' !important;
}
`;
}

let colorObserver = null;

function applyColorSwaps(swaps) {
  if (colorObserver) { colorObserver.disconnect(); colorObserver = null; }
  if (!swaps || swaps.length === 0) return;

  const validSwaps = swaps
    .filter(s => s.from && s.to)
    .map(s => ({
      pattern: new RegExp('#' + normalizeHex(s.from), 'gi'),
      to: '#' + normalizeHex(s.to)
    }));

  if (validSwaps.length === 0) return;

  function processElement(el) {
    const style = el.getAttribute('style');
    if (!style) return;
    let next = style;
    for (const swap of validSwaps) next = next.replace(swap.pattern, swap.to);
    if (next !== style) el.setAttribute('style', next);
  }

  document.querySelectorAll('[style]').forEach(processElement);

  colorObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.hasAttribute('style')) processElement(node);
          node.querySelectorAll('[style]').forEach(processElement);
        });
      } else if (m.type === 'attributes') {
        processElement(m.target);
      }
    }
  });

  colorObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
}

function applyStyles(settings) {
  let el = document.getElementById(STYLE_ID);

  if (!settings.enabled) {
    if (el) el.remove();
    if (colorObserver) { colorObserver.disconnect(); colorObserver = null; }
    return;
  }

  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = settings.fontEnabled ? buildFontCSS() : '';

  applyColorSwaps(settings.colorSwaps);
}

chrome.storage.sync.get(['agStylerSettings'], (result) => {
  const settings = result.agStylerSettings || { enabled: true, fontEnabled: true, colorSwaps: [] };
  applyStyles(settings);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'AG_STYLER_UPDATE') applyStyles(msg.settings);
});
