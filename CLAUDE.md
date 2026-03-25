# AG Styler — Claude Context

## What this is
A Chrome extension (Manifest V3, side panel) that lets users customise the visual style of `autogate.co` (and subdomains) without touching code. Clicking the toolbar icon opens a persistent side panel.

## File structure
| File | Purpose |
|------|---------|
| `manifest.json` | MV3 config — sidePanel, background service worker, content script |
| `background.js` | Service worker — opens side panel on toolbar icon click |
| `popup.html` | Side panel UI (HTML + all CSS inline in `<style>`) |
| `popup.js` | Side panel logic — settings, rendering, dropdown, save/apply |
| `content.js` | Injected into autogate.co — applies all style overrides to the page |
| `ico.svg` | Extension icon |
| `README.md` | User-facing install instructions |

## Settings schema (stored in `chrome.storage.sync` as `agStylerSettings`)
```js
{
  enabled: true,              // master on/off
  selectedFont: 'open-sans',  // 'open-sans' | 'manrope' | 'atkinson' | 'inter'
  colorSwaps: [{ from: 'hex', to: 'hex' }],    // palette-picker swaps
  manualSwaps: [{ from: 'hex', to: 'hex' }],   // free-form hex swaps
  buttonRadius: '',           // px value string e.g. '4'
  pageBgColor: '',            // hex string without # e.g. 'F5F5F5'
  header: {
    bgColor: '',              // hex without #
    linkColor: ''             // hex without #
  }
}
```
On save, `colorSwaps` and `manualSwaps` are merged before sending to content.js.

## How overrides work (content.js)
**Font swap** — scans every element with `getComputedStyle`, checks if `font-family` includes `"open sans"`, then sets inline `font-family: [new font] !important`. Tracked via `data-ag-font` attribute. MutationObserver handles new elements.

**Colour swap** — same scan pattern: checks 12 CSS color properties against the target RGB value, sets inline style with `!important`. Tracked via `data-ag-cs` attribute.

**Button radius** — injects a `<style id="ag-styler-radius">` with a broad button selector.

**Header styles** — injects `<style id="ag-styler-header">`:
- Always: `border-right-width: 0 !important` on `.header` and `.header__brand`
- Always: `background-image: none !important` on `.header__brand`
- Optional: bg colour override on `.header`
- Optional: link/button colour on `.header a`, `.header button`, etc.

**Page background** — injects `<style id="ag-styler-pagebg">` overriding `--bs-body-bg` and `body { background-color }`.

## popup.js key patterns
- Single shared floating `#colorDropdown` element, repositioned on open
- `makeSelectBtn(hex, onSelect)` — creates a swatch button that opens the shared dropdown
- `renderHeaderSection()`, `renderColorList()`, `renderManualList()` — full re-render on each change
- Font dropdown uses a `<select>` (not custom)
- `COLORS` array is the single source of truth for the palette (uppercase hex, no #)

## Colour palette (COLORS in popup.js)
Groups: Primary (blues), Secondary (oranges), Warning (ambers), Error (reds), Success (greens), Neutral (greys), Shades (white/black), Special (teals + purples). All hex stored uppercase without `#`.

## Git workflow
- `develop` → active work branch
- `main` → stable/released
- Merge develop → main when creating a release
- Releases: v1.0.0 (initial), v1.1.0 (side panel + header + font dropdown + colour picker), v1.1.1 (current)
- GitHub repo: `https://github.com/ba1234scx234s/ag-styler`

## Things that don't work / gotchas
- `gh` CLI is not available in Claude's shell — user must run `gh release create` themselves
- Git auth doesn't carry over to Claude's shell — pushes require the user's terminal or stored credentials
- `font-family: revert !important` does NOT restore icon fonts (reverts to UA stylesheet, not page CSS) — always use explicit font-family names for restoration
- Icon font classes (`.material-symbols-*`, `[class*="icon-"]`) must never get Manrope — the computed style scan handles this correctly since those elements don't have "open sans" in their computed font-family
