# GitHub Gist Embed Chrome Extension

![CI](https://github.com/JLLeitschuh/github-gist-embed-plugin/actions/workflows/integration-tests.yml/badge.svg)

A Chrome extension that adds a "Copy Embed" button to GitHub gist pages, allowing you to easily copy embed URLs for specific files within a gist.

## Features

- Adds a "Copy Embed" button next to each file's "Raw" button on GitHub gist pages
- Copies the embed URL in the format: `https://gist.github.com/{username}/{gist_id}?file={filename}`
- Provides visual feedback when the URL is copied
- Works with gists containing multiple files

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the directory containing this extension

## Usage

1. Navigate to any GitHub gist page (e.g., `https://gist.github.com/username/gist-id`)
2. For each file in the gist, you'll see a "Copy Embed" button to the left of the "Raw" button
3. Click the button to copy the embed URL for that specific file
4. The button will briefly show "Copied!" to confirm the action
5. Paste the URL wherever you need it

## Example

For a gist at `https://gist.github.com/JLLeitschuh/f992d92df03e47d79058b1afd661e1e7` with a file named `1B_Response_checkShadowbanStatus.json`, the copied URL will be:

```
https://gist.github.com/JLLeitschuh/f992d92df03e47d79058b1afd661e1e7?file=1B_Response_checkShadowbanStatus.json
```

## Development

### File Structure

- `manifest.json` - Chrome extension manifest (v3)
- `content.js` - Content script that injects the button
- `styles.css` - Styling to match GitHub's button appearance
- `README.md` - This file

### How It Works

1. The content script runs on all `https://gist.github.com/*` pages
2. It extracts the username and gist ID from the URL
3. For each file section, it finds the "Raw" button
4. It extracts the filename from the file header
5. It creates and inserts a "Copy Embed" button before the Raw button
6. When clicked, it copies the formatted embed URL to the clipboard
7. A MutationObserver watches for dynamically loaded content to handle SPA navigation

## License

MIT

## Sponsor

- [GitHub Sponsors](https://github.com/sponsors/JLLeitschuh)
- [Buy Me a Coffee](https://buymeacoffee.com/jlleitschuh)
