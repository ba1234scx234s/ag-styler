// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = [
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
const DEFAULT_SETTINGS = {
  enabled: true,
  fontEnabled: true,
  colorSwaps: [],
  buttonRadius: ''
};

let settings = { ...DEFAULT_SETTINGS };

// ── DOM refs ──────────────────────────────────────────────────────────────────
const toggleEnabled = document.getElementById('toggleEnabled');
const toggleFont    = document.getElementById('toggleFont');
const inputRadius   = document.getElementById('inputRadius');
const colorList     = document.getElementById('colorList');
const btnAddColor   = document.getElementById('btnAddColor');
const btnSave       = document.getElementById('btnSave');
const btnReset      = document.getElementById('btnReset');
const statusMsg     = document.getElementById('statusMsg');
const statusBadge   = document.getElementById('statusBadge');
const dropdown      = document.getElementById('colorDropdown');

// ── Floating dropdown ─────────────────────────────────────────────────────────
let ddTarget = null; // { index, field, btn }

function closeDropdown() {
  dropdown.classList.remove('open');
  ddTarget = null;
}

document.addEventListener('click', closeDropdown);

function openDropdown(btn, index, field) {
  const currentHex = (settings.colorSwaps[index][field] || '').toLowerCase();

  dropdown.innerHTML = '';
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
    item.className = 'dd-item' + (c.hex.toLowerCase() === currentHex ? ' selected' : '');
    item.innerHTML = `
      <span class="swatch" style="background:#${c.hex}"></span>
      <span class="dd-name">${c.name}</span>
      <span class="dd-hex">#${c.hex}</span>
    `;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      settings.colorSwaps[index][field] = c.hex.toLowerCase();
      renderColorList();
      closeDropdown();
    });
    dropdown.appendChild(item);
  }

  // Position below the button
  const rect = btn.getBoundingClientRect();
  dropdown.style.top  = (rect.bottom + 3) + 'px';
  dropdown.style.left = '16px';
  dropdown.style.width = (document.body.offsetWidth - 32) + 'px';
  dropdown.classList.add('open');

  // Scroll selected item into view
  const sel = dropdown.querySelector('.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });

  ddTarget = { index, field, btn };
}

// ── UI rendering ──────────────────────────────────────────────────────────────
chrome.storage.sync.get(['agStylerSettings'], (result) => {
  settings = result.agStylerSettings || { ...DEFAULT_SETTINGS };
  renderUI();
});

function renderUI() {
  toggleEnabled.checked = settings.enabled;
  toggleFont.checked    = settings.fontEnabled;
  inputRadius.value     = settings.buttonRadius || '';
  statusBadge.textContent  = settings.enabled ? 'ON' : 'OFF';
  statusBadge.style.background = settings.enabled ? '#1d6ef5' : '#444';
  renderColorList();
}

function makeSelectBtn(hex, index, field) {
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
    if (ddTarget && ddTarget.index === index && ddTarget.field === field) {
      closeDropdown();
    } else {
      openDropdown(btn, index, field);
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
    row.appendChild(makeSelectBtn(swap.from, i, 'from'));

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '→';
    row.appendChild(arrow);

    row.appendChild(makeSelectBtn(swap.to, i, 'to'));

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

// ── Event listeners ───────────────────────────────────────────────────────────
toggleEnabled.addEventListener('change', () => {
  settings.enabled = toggleEnabled.checked;
  statusBadge.textContent = settings.enabled ? 'ON' : 'OFF';
  statusBadge.style.background = settings.enabled ? '#1d6ef5' : '#444';
});

toggleFont.addEventListener('change', () => {
  settings.fontEnabled = toggleFont.checked;
});

inputRadius.addEventListener('input', () => {
  settings.buttonRadius = inputRadius.value.trim();
});

btnAddColor.addEventListener('click', () => {
  if (!settings.colorSwaps) settings.colorSwaps = [];
  settings.colorSwaps.push({ from: '', to: '' });
  renderColorList();
});

btnSave.addEventListener('click', () => {
  chrome.storage.sync.set({ agStylerSettings: settings }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'AG_STYLER_UPDATE', settings });
    });
    flash('Applied!');
  });
});

btnReset.addEventListener('click', () => {
  settings = { ...DEFAULT_SETTINGS, colorSwaps: [] };
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
