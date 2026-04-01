# update_assets.py

**Purpose**: Automatically scan project dependencies and update the Service Worker's `ASSETS` cache list and optionally `CACHE_NAME`.

## What It Does

1. **Scans** `src/index.html` for:
   - All `<script src="...">` tags  
   - CSS `<link rel="stylesheet" href="...">` tags
   - Favicon `<link rel="icon" href="...">`
   - Special files: `manifest.json`

2. **Reads** `src/manifest.json` for:
   - Icon sources in the `icons` array

3. **Generates** a clean, sorted list of assets

4. **Updates** `src/sw.js` with the new `ASSETS` array

5. **Optionally updates** `CACHE_NAME` for cache invalidation

## Usage

### Basic: Update ASSETS Only

From the workspace root:

```bash
python update_assets.py
```

### Advanced: Update ASSETS + CACHE_NAME

When deploying breaking changes, bump the cache version to force clients to re-download:

```bash
python update_assets.py --cache-name=tgu-v3
```

### Help

```bash
python update_assets.py --help
```

### Output

```
📖 Scanning src/index.html...
🖼️  Checking src/manifest.json...
   Found 1 icon(s) in manifest:
   - favicon-512x512.svg

✅ Total assets: 18
   - ./
   - favicon-512x512.svg
   - favicon.ico
   - index.html
   - js/tgu-bootstrap.js
   - [... rest of files ...]

📝 Updating src/sw.js...
   Cache name: CACHE_NAME = 'tgu-v2'
✅ Done!
```

## When to Run

Run this script whenever you:

- ✅ **Add a new JavaScript file** to the app
- ✅ **Delete a JavaScript file** from the app  
- ✅ **Add/remove CSS files**
- ✅ **Add new icons** to `manifest.json`
- ✅ **Update favicon** in HTML
- ✅ **Before deploying** to ensure sw.js is synchronized

## When to Use `--cache-name`

Use the `--cache-name` parameter when:

- **Breaking changes**: Update app version in a way that makes old cached content invalid
- **Major overhauls**: Significant refactoring that changes behavior
- **Forcing cache refresh**: Need to ensure all clients get the new version

Example progression:
```bash
python update_assets.py                    # tgu-v2 (normal updates)
python update_assets.py --cache-name=tgu-v3  # Breaking change (forces re-cache)
```

## Example: Adding a New Module

If you create `src/js/tgu-newmodule.js` and add it to `src/index.html`:

```html
<script src="js/tgu-newmodule.js"></script>
```

Then run:

```bash
python update_assets.py
```

The script will automatically add `js/tgu-newmodule.js` to the ASSETS list.

## Example: Adding Icons for PWA

If you add a new icon to `src/manifest.json`:

```json
{
  "icons": [
    {"src": "favicon-512x512.svg", "sizes": "512x512", "type": "image/svg"},
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}
  ]
}
```

Then run:

```bash
python update_assets.py
```

The script will add both `favicon-512x512.svg` and `icon-192.png` to the cache.

## How It Works

The script uses:
- **Regex patterns** to extract src/href from HTML tags
- **JSON parsing** to read manifest.json icons
- **Sorting** for deterministic output

Includes:
- Local files only (external URLs with http/https are skipped)
- All scripts, stylesheets, favicon, and embedded icons
- Root directory (`./`) for offline support

## Implementation Details

**Extracted Assets Sources**:
- Script tags: `<script src="[FILE]">`
- CSS links: `<link rel="stylesheet" href="[FILE]">`
- Favicon: `<link rel="icon" href="[FILE]">`
- Manifest icons: JSON `icons[].src`
- Special: `manifest.json`, `index.html`, `./`

**Operation**:
1. Sorts all assets alphabetically
2. Formats JavaScript array syntax
3. Uses regex to replace old ASSETS block
4. Optionally updates CACHE_NAME constant
5. Writes back to sw.js

## Notes

- The script is deterministic (always sorts the same way)
- External URLs (CDN) are automatically skipped
- Both HTML attribute orders are supported (`rel src` or `src rel`)
- If `manifest.json` is missing, icons list is skipped gracefully
- CACHE_NAME update is atomic with ASSETS update

