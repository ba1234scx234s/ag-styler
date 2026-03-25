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
const FONTS = [
  { value: 'open-sans', label: 'Open Sans (default)' },
  { value: 'manrope',   label: 'Manrope' },
  { value: 'atkinson',  label: 'Atkinson Hyperlegible' },
  { value: 'inter',     label: 'Inter' },
];

const DEFAULT_SETTINGS = {
  enabled: true,
  selectedFont: 'open-sans',
  colorSwaps: [],
  buttonRadius: '',
  header: { bgColor: '', linkColor: '', borderColor: '' }
};

let settings = { ...DEFAULT_SETTINGS };

// ── DOM refs ──────────────────────────────────────────────────────────────────
const toggleEnabled  = document.getElementById('toggleEnabled');
const selectFont     = document.getElementById('selectFont');
const inputRadius    = document.getElementById('inputRadius');
const colorList      = document.getElementById('colorList');
const btnAddColor    = document.getElementById('btnAddColor');
const btnSave        = document.getElementById('btnSave');
const btnReset       = document.getElementById('btnReset');
const statusMsg      = document.getElementById('statusMsg');
const statusBadge    = document.getElementById('statusBadge');
const dropdown       = document.getElementById('colorDropdown');
const headerBgWrap     = document.getElementById('headerBgWrap');
const headerLinkWrap   = document.getElementById('headerLinkWrap');
const headerBorderWrap = document.getElementById('headerBorderWrap');

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

chrome.storage.sync.get(['agStylerSettings'], (result) => {
  const saved = result.agStylerSettings || {};
  if (!saved.selectedFont) {
    saved.selectedFont = saved.fontEnabled === false ? 'open-sans' : 'manrope';
  }
  settings = {
    ...DEFAULT_SETTINGS,
    ...saved,
    header: { ...DEFAULT_SETTINGS.header, ...(saved.header || {}) }
  };
  renderUI();
});

function renderUI() {
  toggleEnabled.checked = settings.enabled;
  selectFont.value      = settings.selectedFont || 'open-sans';
  inputRadius.value     = settings.buttonRadius || '';
  statusBadge.textContent  = settings.enabled ? 'ON' : 'OFF';
  statusBadge.style.background = settings.enabled ? '#1d6ef5' : '#444';
  renderHeaderSection();
  renderColorList();
}

function renderHeaderSection() {
  if (!settings.header) settings.header = { bgColor: '', linkColor: '' };

  headerBgWrap.innerHTML = '';
  headerBgWrap.appendChild(makeSelectBtn(settings.header.bgColor, (hex) => {
    settings.header.bgColor = hex;
    renderHeaderSection();
  }));

  headerLinkWrap.innerHTML = '';
  headerLinkWrap.appendChild(makeSelectBtn(settings.header.linkColor, (hex) => {
    settings.header.linkColor = hex;
    renderHeaderSection();
  }));

  headerBorderWrap.innerHTML = '';
  headerBorderWrap.appendChild(makeSelectBtn(settings.header.borderColor, (hex) => {
    settings.header.borderColor = hex;
    renderHeaderSection();
  }));
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

// ── Event listeners ───────────────────────────────────────────────────────────
toggleEnabled.addEventListener('change', () => {
  settings.enabled = toggleEnabled.checked;
  statusBadge.textContent = settings.enabled ? 'ON' : 'OFF';
  statusBadge.style.background = settings.enabled ? '#1d6ef5' : '#444';
});

selectFont.addEventListener('change', () => {
  settings.selectedFont = selectFont.value;
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
