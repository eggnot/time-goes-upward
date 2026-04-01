#!/usr/bin/env python3
"""
Update ASSETS in sw.js based on dependencies in index.html and manifest.json
Scans for:
  - <script src="..."> tags
  - <link rel="stylesheet" href="..."> tags
  - <link rel="icon" href="..."> tags
  - Icon sources in manifest.json

Optional: Update CACHE_NAME version with --cache-name parameter
"""

import re
import json
import sys
from pathlib import Path


def extract_assets_from_html(html_path):
    """Extract script, CSS, and icon references from HTML file."""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    assets = set()
    
    # Extract script sources: <script src="...">
    script_pattern = r'<script\s+[^>]*src=["\']([^"\']+)["\']'
    scripts = re.findall(script_pattern, content)
    for script in scripts:
        if not script.startswith('http'):  # Skip external URLs
            assets.add(script)
    
    # Extract CSS link references: <link rel="stylesheet" href="...">
    # Match both orders: rel=... href=... or href=... rel=...
    css_pattern = r'<link[^>]*(rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\']|href=["\']([^"\']+)["\'][^>]*rel=["\']stylesheet["\'])'
    css_matches = re.findall(css_pattern, content)
    for match in css_matches:
        href = match[1] if match[1] else match[2]
        if href and not href.startswith('http'):
            assets.add(href)
    
    # Extract favicon: <link rel="icon" href="...">
    icon_pattern = r'<link[^>]*(rel=["\']icon["\'][^>]*href=["\']([^"\']+)["\']|href=["\']([^"\']+)["\'][^>]*rel=["\']icon["\'])'
    icon_matches = re.findall(icon_pattern, content)
    for match in icon_matches:
        href = match[1] if match[1] else match[2]
        if href and not href.startswith('http'):
            assets.add(href)
    
    
    # Add basic assets
    assets.add('./')
    assets.add('index.html')
    
    return assets


def extract_icons_from_manifest(manifest_path):
    """Extract icon sources from manifest.json."""
    icons = set()
    
    if not manifest_path.exists():
        return icons
    
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        if 'icons' in manifest and isinstance(manifest['icons'], list):
            for icon_obj in manifest['icons']:
                if 'src' in icon_obj:
                    src = icon_obj['src']
                    if src and not src.startswith('http'):
                        icons.add(src)
    except json.JSONDecodeError:
        print(f"⚠️  Warning: Could not parse {manifest_path}")
    
    return icons


def update_sw_assets(sw_path, assets, cache_name=None):
    """Update ASSETS array and optionally CACHE_NAME in sw.js file."""
    with open(sw_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Format the ASSETS array as JavaScript
    assets_js = "const ASSETS = [\n"
    for asset in sorted(list(assets)):
        assets_js += f"  '{asset}',\n"
    assets_js += "];"
    
    # Replace old ASSETS array
    pattern = r'const ASSETS = \[[\s\S]*?\];'
    content = re.sub(pattern, assets_js, content)
    
    # Update CACHE_NAME if provided
    if cache_name:
        cache_pattern = r"const CACHE_NAME = '[^']*';"
        cache_replacement = f"const CACHE_NAME = '{cache_name}';"
        content = re.sub(cache_pattern, cache_replacement, content)
    
    with open(sw_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True


def main():
    """Main script: extract assets from HTML/manifest and update sw.js"""
    workspace_root = Path(__file__).parent
    html_path = workspace_root / 'src' / 'index.html'
    manifest_path = workspace_root / 'src' / 'manifest.json'
    sw_path = workspace_root / 'src' / 'sw.js'
    
    # Parse command-line arguments
    cache_name = None
    if len(sys.argv) > 1:
        if sys.argv[1].startswith('--cache-name='):
            cache_name = sys.argv[1].split('=', 1)[1]
        elif sys.argv[1] == '--help' or sys.argv[1] == '-h':
            print_help()
            return True
    
    # Validate files exist
    if not html_path.exists():
        print(f"❌ Error: {html_path} not found")
        return False
    
    if not sw_path.exists():
        print(f"❌ Error: {sw_path} not found")
        return False
    
    # Extract assets
    print(f"📖 Scanning {html_path.relative_to(workspace_root)}...")
    assets = extract_assets_from_html(html_path)
    
    print(f"🖼️  Checking {manifest_path.relative_to(workspace_root)}...")
    icons = extract_icons_from_manifest(manifest_path)
    assets.update(icons)
    
    if icons:
        print(f"   Found {len(icons)} icon(s) in manifest:")
        for icon in sorted(icons):
            print(f"   - {icon}")
    
    print(f"\n✅ Total assets: {len(assets)}")
    for asset in sorted(assets):
        print(f"   - {asset}")
    
    # Update sw.js
    print(f"\n📝 Updating {sw_path.relative_to(workspace_root)}...")
    update_sw_assets(sw_path, assets, cache_name)
    
    if cache_name:
        print(f"   Cache name: CACHE_NAME = '{cache_name}'")
    
    print(f"✅ Done!")
    return True


def print_help():
    """Print usage information."""
    print("""
update_assets.py - Sync Service Worker assets with project dependencies

USAGE:
  python update_assets.py                 # Update ASSETS list only
  python update_assets.py --cache-name=VER  # Update ASSETS + CACHE_NAME

EXAMPLES:
  python update_assets.py
  python update_assets.py --cache-name=tgu-v3

OPTIONS:
  --cache-name=NAME    Update CACHE_NAME constant to this value
                       (e.g., tgu-v2, tgu-v3, etc.)
  --help, -h           Show this help message

WHAT IT DOES:
  1. Scans src/index.html for <script> and <link> tags
  2. Extracts icon paths from src/manifest.json
  3. Updates const ASSETS array in src/sw.js
  4. Optionally updates CACHE_NAME (useful for cache invalidation)

WHEN TO RUN:
  - After adding/removing JavaScript modules
  - After adding/removing CSS files
  - When adding new icons to manifest.json
  - Before deploying (to sync cached assets)
  - When deploying breaking changes (use --cache-name to bump version)
""")


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)

