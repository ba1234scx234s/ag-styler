const DEFAULT_SETTINGS = {
  enabled: true,
  fontEnabled: true,
  colorSwaps: []
};

let settings = { ...DEFAULT_SETTINGS };

// DOM refs
const toggleEnabled = document.getElementById('toggleEnabled');
const toggleFont = document.getElementById('toggleFont');
const colorList = document.getElementById('colorList');
const btnAddColor = document.getElementById('btnAddColor');
const btnSave = document.getElementById('btnSave');
const btnReset = document.getElementById('btnReset');
const statusMsg = document.getElementById('statusMsg');
const statusBadge = document.getElementById('statusBadge');

// Load settings on open
chrome.storage.sync.get(['agStylerSettings'], (result) => {
  settings = result.agStylerSettings || { ...DEFAULT_SETTINGS };
  renderUI();
});

function renderUI() {
  toggleEnabled.checked = settings.enabled;
  toggleFont.checked = settings.fontEnabled;
  statusBadge.textContent = settings.enabled ? 'ON' : 'OFF';
  statusBadge.style.background = settings.enabled ? '#1d6ef5' : '#444';
  renderColorList();
}

function renderColorList() {
  colorList.innerHTML = '';
  const swaps = settings.colorSwaps || [];

  swaps.forEach((swap, i) => {
    const row = document.createElement('div');
    row.className = 'color-row';
    row.innerHTML = `
      <input type="text" class="from-input" placeholder="#old hex" value="${escHtml(swap.from || '')}" data-index="${i}" />
      <span class="arrow">→</span>
      <input type="text" class="to-input" placeholder="#new hex" value="${escHtml(swap.to || '')}" data-index="${i}" />
      <button class="btn-remove" data-index="${i}" title="Remove">×</button>
    `;
    colorList.appendChild(row);
  });

  colorList.querySelectorAll('.from-input').forEach(el => {
    el.addEventListener('input', e => {
      settings.colorSwaps[+e.target.dataset.index].from = e.target.value;
    });
  });
  colorList.querySelectorAll('.to-input').forEach(el => {
    el.addEventListener('input', e => {
      settings.colorSwaps[+e.target.dataset.index].to = e.target.value;
    });
  });
  colorList.querySelectorAll('.btn-remove').forEach(el => {
    el.addEventListener('click', e => {
      settings.colorSwaps.splice(+e.target.dataset.index, 1);
      renderColorList();
    });
  });
}

toggleEnabled.addEventListener('change', () => {
  settings.enabled = toggleEnabled.checked;
  statusBadge.textContent = settings.enabled ? 'ON' : 'OFF';
  statusBadge.style.background = settings.enabled ? '#1d6ef5' : '#444';
});

toggleFont.addEventListener('change', () => {
  settings.fontEnabled = toggleFont.checked;
});

btnAddColor.addEventListener('click', () => {
  if (!settings.colorSwaps) settings.colorSwaps = [];
  settings.colorSwaps.push({ from: '', to: '' });
  renderColorList();
});

btnSave.addEventListener('click', () => {
  chrome.storage.sync.set({ agStylerSettings: settings }, () => {
    // Push live update to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'AG_STYLER_UPDATE', settings });
      }
    });
    flash('Applied!');
  });
});

btnReset.addEventListener('click', () => {
  settings = { ...DEFAULT_SETTINGS, colorSwaps: [] };
  chrome.storage.sync.set({ agStylerSettings: settings }, () => {
    renderUI();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'AG_STYLER_UPDATE', settings });
      }
    });
    flash('Reset to defaults');
  });
});

function flash(msg) {
  statusMsg.textContent = msg;
  setTimeout(() => { statusMsg.textContent = ''; }, 2000);
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
