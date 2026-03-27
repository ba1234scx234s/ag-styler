// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = [
  { name: 'carsales-blue', hex: '0073E3', group: 'Primary' },
  { name: 'blue-50',     hex: 'F2F8FC', group: 'Primary' },
  { name: 'blue-500',    hex: '027CC2', group: 'Primary' },
  { name: 'blue-600',    hex: '0270AF', group: 'Primary' },
  { name: 'blue-800',    hex: '004E7A', group: 'Primary' },
  { name: 'blue-900',    hex: '003452', group: 'Primary' },
  { name: 'orange-50',   hex: 'FFF7F0', group: 'Secondary' },
  { name: 'orange-500',  hex: 'EB7200', group: 'Secondary' },
  { name: 'orange-600',  hex: 'D46700', group: 'Secondary' },
  { name: 'orange-700',  hex: 'B36200', group: 'Secondary' },
  { name: 'amber-50',    hex: 'FFF3E0', group: 'Warning' },
  { name: 'amber-500',   hex: 'EB9B00', group: 'Warning' },
  { name: 'amber-600',   hex: 'D07600', group: 'Warning' },
  { name: 'amber-700',   hex: '8F7000', group: 'Warning' },
  { name: 'red-50',      hex: 'FFEBEE', group: 'Error' },
  { name: 'red-500',     hex: 'D63D3D', group: 'Error' },
  { name: 'red-600',     hex: 'B90000', group: 'Error' },
  { name: 'green-50',    hex: 'ECFFE5', group: 'Success' },
  { name: 'green-500',   hex: '54BF30', group: 'Success' },
  { name: 'green-600',   hex: '218500', group: 'Success' },
  { name: 'grey-50',     hex: 'F5F5F5', group: 'Neutral' },
  { name: 'grey-100',    hex: 'EEEEEE', group: 'Neutral' },
  { name: 'grey-200',    hex: 'DDDDDD', group: 'Neutral' },
  { name: 'grey-300',    hex: 'CCCCCC', group: 'Neutral' },
  { name: 'grey-400',    hex: '808080', group: 'Neutral' },
  { name: 'grey-500',    hex: '606060', group: 'Neutral' },
  { name: 'grey-600',    hex: '404040', group: 'Neutral' },
  { name: 'grey-700',    hex: '212121', group: 'Neutral' },
  { name: 'White',       hex: 'FFFFFF', group: 'Shades' },
  { name: 'Black',       hex: '000000', group: 'Shades' },
  { name: 'teal-50',     hex: 'E5FDFF', group: 'Special' },
  { name: 'teal-500',    hex: '8DE9C6', group: 'Special' },
  { name: 'teal-600',    hex: '24AD60', group: 'Special' },
  { name: 'teal-700',    hex: '00B18A', group: 'Special' },
  { name: 'teal-800',    hex: '007578', group: 'Special' },
  { name: 'purple-50',   hex: 'F3EBFA', group: 'Special' },
  { name: 'purple-500',  hex: 'A347D1', group: 'Special' },
  { name: 'purple-600',  hex: '9933CC', group: 'Special' },
  { name: 'purple-700',  hex: '8A2EB8', group: 'Special' },
  { name: 'purple-800',  hex: '7A29A3', group: 'Special' },
];

function colorByHex(hex) {
  return COLORS.find(c => c.hex.toLowerCase() === (hex || '').toLowerCase()) || null;
}

// ── Settings ──────────────────────────────────────────────────────────────────
const FONTS = [
  { value: 'open-sans', label: 'Open Sans (default)' },
  { value: 'manrope',   label: 'Manrope' },
  { value: 'atkinson',  label: 'Atkinson Hyperlegible' },
  { value: 'inter',     label: 'Inter' },
  { value: 'comic-sans', label: 'Comic Sans' },
];

const DEFAULT_SETTINGS = {
  enabled: true,
  selectedFont: 'open-sans',
  colorSwaps: [],
  manualSwaps: [],
  buttonRadius: '',
  pageBgColor: '',
  header: { bgColor: '', linkColor: '', logoSize: 100 },
  nav: { sidebarBg: '', linkColor: '', activeBg: '', hoverBg: '' }
};

let settings = { ...DEFAULT_SETTINGS };

// ── DOM refs ──────────────────────────────────────────────────────────────────
const toggleEnabled  = document.getElementById('toggleEnabled');
const selectFont     = document.getElementById('selectFont');
const inputPageBg    = document.getElementById('inputPageBg');
const inputRadius    = document.getElementById('inputRadius');
const colorList      = document.getElementById('colorList');
const btnAddColor    = document.getElementById('btnAddColor');
const manualList     = document.getElementById('manualList');
const btnAddManual   = document.getElementById('btnAddManual');
const btnSave        = document.getElementById('btnSave');
const btnReset       = document.getElementById('btnReset');
const statusMsg      = document.getElementById('statusMsg');
document.getElementById('versionLabel').textContent = 'v' + chrome.runtime.getManifest().version;
const statusBadge    = document.getElementById('statusBadge');
const dropdown       = document.getElementById('colorDropdown');
const inputNavSidebarBg = document.getElementById('inputNavSidebarBg');
const inputNavLinkColor = document.getElementById('inputNavLinkColor');
const inputNavActiveBg  = document.getElementById('inputNavActiveBg');
const inputNavHoverBg   = document.getElementById('inputNavHoverBg');
const inputHeaderBg   = document.getElementById('inputHeaderBg');
const inputHeaderLink = document.getElementById('inputHeaderLink');
const inputLogoSize  = document.getElementById('inputLogoSize');
const inputLogo      = document.getElementById('inputLogo');
const btnUploadLogo  = document.getElementById('btnUploadLogo');
const btnClearLogo   = document.getElementById('btnClearLogo');
const logoPreview    = document.getElementById('logoPreview');
const logoPreviewRow = document.getElementById('logoPreviewRow');

let currentLogo = '';

// ── Floating dropdown ─────────────────────────────────────────────────────────
let ddTarget = null; // { btn }

function closeDropdown() {
  dropdown.classList.remove('open');
  ddTarget = null;
}

document.addEventListener('click', closeDropdown);

function openDropdown(btn, currentHex, onSelect) {
  const normHex = (currentHex || '').toLowerCase();

  dropdown.innerHTML = '';

  // None option
  const noneItem = document.createElement('li');
  noneItem.className = 'dd-item' + (!normHex ? ' selected' : '');
  noneItem.innerHTML = `<span class="dd-name" style="font-style:italic;color:#555">— None —</span>`;
  noneItem.addEventListener('click', e => {
    e.stopPropagation();
    onSelect('');
    closeDropdown();
  });
  dropdown.appendChild(noneItem);

  let lastGroup = null;
  for (const c of COLORS) {
    if (c.group !== lastGroup) {
      lastGroup = c.group;
      const hdr = document.createElement('li');
      hdr.className = 'dd-group';
      hdr.textContent = c.group;
      dropdown.appendChild(hdr);
    }
    const item = document.createElement('li');
    item.className = 'dd-item' + (c.hex.toLowerCase() === normHex ? ' selected' : '');
    item.innerHTML = `
      <span class="swatch" style="background:#${c.hex}"></span>
      <span class="dd-name">${c.name}</span>
      <span class="dd-hex">#${c.hex}</span>
    `;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(c.hex.toLowerCase());
      closeDropdown();
    });
    dropdown.appendChild(item);
  }

  const rect = btn.getBoundingClientRect();
  dropdown.style.top  = (rect.bottom + 3) + 'px';
  dropdown.style.left = '16px';
  dropdown.style.width = (document.body.offsetWidth - 32) + 'px';
  dropdown.classList.add('open');

  const sel = dropdown.querySelector('.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });

  ddTarget = { btn };
}

// ── UI rendering ──────────────────────────────────────────────────────────────

// Populate font options once
FONTS.forEach(f => {
  const opt = document.createElement('option');
  opt.value = f.value;
  opt.textContent = f.label;
  selectFont.appendChild(opt);
});

// ── Logo upload ───────────────────────────────────────────────────────────────

function renderLogoUI() {
  if (currentLogo) {
    logoPreview.src = currentLogo;
    logoPreviewRow.style.display = 'block';
    btnClearLogo.style.display = 'inline-block';
  } else {
    logoPreviewRow.style.display = 'none';
    btnClearLogo.style.display = 'none';
  }
}

chrome.storage.local.get(['agStylerLogo'], (r) => {
  currentLogo = r.agStylerLogo || '';
  renderLogoUI();
});

btnUploadLogo.addEventListener('click', () => inputLogo.click());

inputLogo.addEventListener('change', () => {
  const file = inputLogo.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentLogo = e.target.result;
    chrome.storage.local.set({ agStylerLogo: currentLogo });
    renderLogoUI();
  };
  reader.readAsDataURL(file);
  inputLogo.value = '';
});

inputHeaderBg.addEventListener('input', () => {
  if (!settings.header) settings.header = {};
  settings.header.bgColor = inputHeaderBg.value.trim().replace(/^#/, '');
});

inputHeaderLink.addEventListener('input', () => {
  if (!settings.header) settings.header = {};
  settings.header.linkColor = inputHeaderLink.value.trim().replace(/^#/, '');
});

inputLogoSize.addEventListener('input', () => {
  if (!settings.header) settings.header = {};
  settings.header.logoSize = parseInt(inputLogoSize.value, 10) || 100;
});

btnClearLogo.addEventListener('click', () => {
  currentLogo = '';
  chrome.storage.local.remove('agStylerLogo');
  renderLogoUI();
});

// ── Load settings ─────────────────────────────────────────────────────────────

chrome.storage.sync.get(['agStylerSettings'], (result) => {
  const saved = result.agStylerSettings || {};
  if (!saved.selectedFont) {
    saved.selectedFont = saved.fontEnabled === false ? 'open-sans' : 'manrope';
  }
  settings = {
    ...DEFAULT_SETTINGS,
    ...saved,
    header: { ...DEFAULT_SETTINGS.header, ...(saved.header || {}) },
    nav: { ...DEFAULT_SETTINGS.nav, ...(saved.nav || {}) },
    manualSwaps: saved.manualSwaps || []
  };
  inputLogoSize.value      = settings.header.logoSize ?? 100;
  inputHeaderBg.value      = settings.header.bgColor   || '';
  inputHeaderLink.value    = settings.header.linkColor  || '';
  inputNavSidebarBg.value  = settings.nav.sidebarBg  || '';
  inputNavLinkColor.value  = settings.nav.linkColor  || '';
  inputNavActiveBg.value   = settings.nav.activeBg   || '';
  inputNavHoverBg.value    = settings.nav.hoverBg    || '';
  renderUI();
});

function renderUI() {
  toggleEnabled.checked = settings.enabled;
  selectFont.value      = settings.selectedFont || 'open-sans';
  inputPageBg.value     = settings.pageBgColor || '';
  inputRadius.value     = settings.buttonRadius || '';
  statusBadge.textContent  = settings.enabled ? 'ON' : 'OFF';
  statusBadge.style.background = settings.enabled ? '#1d6ef5' : '#444';
  renderColorList();
  renderManualList();
}


function makeSelectBtn(hex, onSelect) {
  const wrap = document.createElement('div');
  wrap.className = 'color-select';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'color-select-btn';

  const color = colorByHex(hex);
  btn.innerHTML = `
    <span class="swatch" style="background:${color ? '#' + color.hex : 'transparent'}; ${!color ? 'border-color:#333' : ''}"></span>
    <span class="cs-name">${color ? color.name : 'Select…'}</span>
    <span class="cs-chevron">▾</span>
  `;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (ddTarget && ddTarget.btn === btn) {
      closeDropdown();
    } else {
      openDropdown(btn, hex, onSelect);
    }
  });

  wrap.appendChild(btn);
  return wrap;
}

function renderColorList() {
  colorList.innerHTML = '';
  const swaps = settings.colorSwaps || [];

  swaps.forEach((swap, i) => {
    const row = document.createElement('div');
    row.className = 'color-row';
    row.appendChild(makeSelectBtn(swap.from, (hex) => {
      settings.colorSwaps[i].from = hex;
      renderColorList();
    }));

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '→';
    row.appendChild(arrow);

    row.appendChild(makeSelectBtn(swap.to, (hex) => {
      settings.colorSwaps[i].to = hex;
      renderColorList();
    }));

    const del = document.createElement('button');
    del.className = 'btn-remove';
    del.title = 'Remove';
    del.textContent = '×';
    del.addEventListener('click', () => {
      settings.colorSwaps.splice(i, 1);
      renderColorList();
    });
    row.appendChild(del);

    colorList.appendChild(row);
  });
}

function renderManualList() {
  manualList.innerHTML = '';
  (settings.manualSwaps || []).forEach((swap, i) => {
    const row = document.createElement('div');
    row.className = 'manual-row';
    row.innerHTML = `
      <span class="hash">#</span>
      <input type="text" maxlength="6" placeholder="000000" value="${swap.from || ''}" data-i="${i}" data-field="from" spellcheck="false" />
      <span class="arrow">→</span>
      <span class="hash">#</span>
      <input type="text" maxlength="6" placeholder="000000" value="${swap.to || ''}" data-i="${i}" data-field="to" spellcheck="false" />
      <button class="btn-remove" data-i="${i}" title="Remove">×</button>
    `;
    manualList.appendChild(row);
  });
}

// ── Event listeners ───────────────────────────────────────────────────────────
toggleEnabled.addEventListener('change', () => {
  settings.enabled = toggleEnabled.checked;
  statusBadge.textContent = settings.enabled ? 'ON' : 'OFF';
  statusBadge.style.background = settings.enabled ? '#1d6ef5' : '#444';
});

selectFont.addEventListener('change', () => {
  settings.selectedFont = selectFont.value;
});

inputPageBg.addEventListener('input', () => {
  settings.pageBgColor = inputPageBg.value.trim().replace(/^#/, '');
});

inputRadius.addEventListener('input', () => {
  settings.buttonRadius = inputRadius.value.trim();
});

[
  [inputNavSidebarBg, 'sidebarBg'],
  [inputNavLinkColor, 'linkColor'],
  [inputNavActiveBg,  'activeBg'],
  [inputNavHoverBg,   'hoverBg'],
].forEach(([el, key]) => {
  el.addEventListener('input', () => {
    if (!settings.nav) settings.nav = {};
    settings.nav[key] = el.value.trim().replace(/^#/, '');
  });
});

btnAddColor.addEventListener('click', () => {
  if (!settings.colorSwaps) settings.colorSwaps = [];
  settings.colorSwaps.push({ from: '', to: '' });
  renderColorList();
});

btnAddManual.addEventListener('click', () => {
  if (!settings.manualSwaps) settings.manualSwaps = [];
  settings.manualSwaps.push({ from: '', to: '' });
  renderManualList();
});

manualList.addEventListener('input', (e) => {
  const input = e.target.closest('input[data-i]');
  if (!input) return;
  const i = +input.dataset.i;
  const field = input.dataset.field;
  if (!settings.manualSwaps[i]) return;
  settings.manualSwaps[i][field] = input.value.trim().replace(/^#/, '').toLowerCase();
});

manualList.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-remove[data-i]');
  if (!btn) return;
  settings.manualSwaps.splice(+btn.dataset.i, 1);
  renderManualList();
});

btnSave.addEventListener('click', () => {
  const merged = {
    ...settings,
    colorSwaps: [
      ...(settings.colorSwaps || []),
      ...(settings.manualSwaps || []).filter(s => s.from && s.to)
    ]
  };
  chrome.storage.sync.set({ agStylerSettings: settings }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'AG_STYLER_UPDATE', settings: merged, logo: currentLogo });
    });
    flash('Applied!');
  });
});

btnReset.addEventListener('click', () => {
  settings = { ...DEFAULT_SETTINGS, colorSwaps: [], manualSwaps: [] };
  chrome.storage.sync.set({ agStylerSettings: settings }, () => {
    renderUI();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'AG_STYLER_UPDATE', settings });
    });
    flash('Reset to defaults');
  });
});

function flash(msg) {
  statusMsg.textContent = msg;
  setTimeout(() => { statusMsg.textContent = ''; }, 2000);
}
