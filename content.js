const STYLE_ID = 'ag-styler-overrides';
const COLOR_OVERRIDE_ID = 'ag-styler-color-overrides';

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
[class*="material-symbols"],
[class*="material-icons"] {
  font-family: 'Material Symbols Rounded', 'Material Symbols Outlined',
               'Material Icons', 'Material Icons Round', 'Material Icons Outlined' !important;
}
`;
}

let colorObserver = null;

// Extract override rules from browser CSSOM (same-origin sheets)
function extractFromCSSOM(rules, swaps, mediaPrefix) {
  const overrides = [];
  for (const rule of rules) {
    if (rule instanceof CSSStyleRule) {
      for (const swap of swaps) {
        const decls = [];
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          const val = rule.style.getPropertyValue(prop);
          if (val.toLowerCase().includes(swap.patternStr)) {
            decls.push(`${prop}: ${val.replace(swap.pattern, swap.to)} !important`);
          }
        }
        if (decls.length) {
          const inner = `${rule.selectorText} { ${decls.join('; ')} }`;
          overrides.push(mediaPrefix ? `${mediaPrefix} { ${inner} }` : inner);
        }
      }
    } else if (rule instanceof CSSMediaRule) {
      overrides.push(...extractFromCSSOM(
        rule.cssRules, swaps, `@media ${rule.media.mediaText}`
      ));
    }
  }
  return overrides;
}

// Extract override rules from raw CSS text (cross-origin fetched sheets)
function extractFromText(cssText, swaps) {
  const overrides = [];
  for (const swap of swaps) {
    if (!cssText.toLowerCase().includes(swap.patternStr)) continue;
    const ruleRe = /([^@{}\n][^{}]*)\{([^{}]+)\}/g;
    let m;
    while ((m = ruleRe.exec(cssText)) !== null) {
      const declarations = m[2];
      if (!declarations.toLowerCase().includes(swap.patternStr)) continue;
      const selector = m[1].trim();
      const newDecls = declarations
        .split(';')
        .filter(d => d.trim())
        .map(d => d.toLowerCase().includes(swap.patternStr)
          ? d.replace(swap.pattern, swap.to).trimEnd() + ' !important'
          : d)
        .join('; ');
      overrides.push(`${selector} { ${newDecls} }`);
    }
  }
  return overrides;
}

async function applyColorSwaps(swaps) {
  if (colorObserver) { colorObserver.disconnect(); colorObserver = null; }
  const oldEl = document.getElementById(COLOR_OVERRIDE_ID);
  if (oldEl) oldEl.remove();

  if (!swaps || swaps.length === 0) return;

  const validSwaps = swaps
    .filter(s => s.from && s.to)
    .map(s => ({
      pattern: new RegExp('#' + normalizeHex(s.from), 'gi'),
      patternStr: '#' + normalizeHex(s.from),
      to: '#' + normalizeHex(s.to)
    }));

  if (validSwaps.length === 0) return;

  // Replace inline style attributes
  function processInlineStyle(el) {
    const style = el.getAttribute('style');
    if (!style) return;
    let next = style;
    for (const swap of validSwaps) next = next.replace(swap.pattern, swap.to);
    if (next !== style) el.setAttribute('style', next);
  }
  document.querySelectorAll('[style]').forEach(processInlineStyle);

  // Build overrides from all stylesheets
  const overrideRules = [];
  await Promise.all(Array.from(document.styleSheets).map(async sheet => {
    if (sheet.ownerNode && [STYLE_ID, COLOR_OVERRIDE_ID].includes(sheet.ownerNode.id)) return;
    try {
      overrideRules.push(...extractFromCSSOM(sheet.cssRules, validSwaps, null));
    } catch {
      if (sheet.href) {
        try {
          const resp = await fetch(sheet.href);
          const text = await resp.text();
          overrideRules.push(...extractFromText(text, validSwaps));
        } catch { /* skip inaccessible */ }
      }
    }
  }));

  if (overrideRules.length) {
    const overrideEl = document.createElement('style');
    overrideEl.id = COLOR_OVERRIDE_ID;
    (document.head || document.documentElement).appendChild(overrideEl);
    overrideEl.textContent = overrideRules.join('\n');
  }

  // Watch for dynamically added inline styles
  colorObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.hasAttribute('style')) processInlineStyle(node);
          node.querySelectorAll('[style]').forEach(processInlineStyle);
        });
      } else if (m.type === 'attributes') {
        processInlineStyle(m.target);
      }
    }
  });

  colorObserver.observe(document.documentElement, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['style']
  });
}

async function applyStyles(settings) {
  let el = document.getElementById(STYLE_ID);
  const colorEl = document.getElementById(COLOR_OVERRIDE_ID);

  if (!settings.enabled) {
    if (el) el.remove();
    if (colorEl) colorEl.remove();
    if (colorObserver) { colorObserver.disconnect(); colorObserver = null; }
    return;
  }

  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(el);
  }
  el.textContent = settings.fontEnabled ? buildFontCSS() : '';

  await applyColorSwaps(settings.colorSwaps);
}

chrome.storage.sync.get(['agStylerSettings'], (result) => {
  const settings = result.agStylerSettings || { enabled: true, fontEnabled: true, colorSwaps: [] };
  applyStyles(settings);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'AG_STYLER_UPDATE') applyStyles(msg.settings);
});
