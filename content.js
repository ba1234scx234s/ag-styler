const STYLE_ID = 'ag-styler-overrides';

function buildCSS(settings) {
  if (!settings.enabled) return '';

  const rules = [];

  // Font swap: replace Open Sans with Manrope
  if (settings.fontEnabled) {
    rules.push(`
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');

* {
  font-family: Manrope, sans-serif !important;
}
[style*="Open Sans"], [class*="open-sans"], [class*="opensans"] {
  font-family: Manrope, sans-serif !important;
}
`);
  }

  // Colour swaps — target inline styles
  if (settings.colorSwaps && settings.colorSwaps.length > 0) {
    for (const swap of settings.colorSwaps) {
      if (!swap.from || !swap.to) continue;
      rules.push(`[style*="${swap.from}"] { color: ${swap.to} !important; background-color: ${swap.to} !important; }`);
    }
  }

  return rules.join('\n');
}

function applyStyles(settings) {
  let el = document.getElementById(STYLE_ID);

  if (!settings.enabled) {
    if (el) el.remove();
    return;
  }

  const css = buildCSS(settings);

  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = css;
}

// Load settings from storage and apply
chrome.storage.sync.get(['agStylerSettings'], (result) => {
  const settings = result.agStylerSettings || { enabled: true, fontEnabled: true, colorSwaps: [] };
  applyStyles(settings);
});

// Listen for live updates from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'AG_STYLER_UPDATE') {
    applyStyles(msg.settings);
  }
});
