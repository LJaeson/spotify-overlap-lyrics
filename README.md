# Spotify Lyrics Overlay

<p align="center">
  <img src="/src/assets/logoP.png" alt="Spotify Lyrics Overlay logo" width="180">
</p>

Always-on-top desktop lyrics overlay for Spotify on macOS.

The app shows synced lyric lines in a transparent floating window while Spotify is playing.

## Quick Install for Users

**We only support MacOS right now!**

1. Open the latest release and download the macOS build (`.dmg` or `.zip`).
2. Move `Spotify Lyrics Overlay.app` to your `Applications` folder.
3. Open the app (if macOS warns, right-click the app, click `Open`, then click `Open` again).
4. Right-click the lyric window and click `set cert`, then follow the Terminal prompt.
5. Open Spotify, play a song, and keep Spotify's Lyrics panel open.

If macOS still blocks launch, run:

```bash
xattr -dr com.apple.quarantine "/Applications/Spotify Lyrics Overlay.app"
```

## Features

- Transparent, frameless, always-on-top lyric overlay.
- Live lyric updates synced to current Spotify playback.
- Right-click context menu controls:
  - set cert
  - set/unset proxy
  - network service selection
  - font size
  - background transparency
  - hide / always-on-top / quit
- Auto-resizing lyric window based on text content.
- Local preference persistence (`electron-store`).
- Electron Forge build pipeline with DMG + ZIP outputs on macOS.

## Architecture

1. App starts, detects active macOS network service.
2. App enables local proxy (`127.0.0.1:7381`) via `networksetup`.
3. Bundled extractor process reads Spotify traffic and parses lyric payloads.
4. Main process forwards lyrics to renderer via IPC.
5. Overlay UI updates text and resizes smoothly.
6. On quit, app disables proxy.

## Requirements

- macOS
- Node.js 18+ (Node 20 recommended)
- npm
- Spotify desktop app

## Development Setup

```bash
git clone https://github.com/LJaeson/spotify-overlap-lyrics.git
cd spotify-overlap-lyrics
npm install
npm start
```

## First Run Guide

1. Launch Spotify and start playback.
2. Launch Spotify Lyrics Overlay.
3. Right-click lyric window, then click `set cert`.
4. Follow Terminal prompt to trust certificate (admin password required).
5. In Spotify, keep the Lyrics panel open.

If no lyrics appear:

- Right-click → `set proxy`.
- Check `network service` selection in context menu.
- Restart Spotify, then play another track.

## Context Menu Reference

- `set cert` — trust mitmproxy cert in System Keychain.
- `set proxy` — enable system web + secure proxy for selected network service.
- `unset proxy` — disable system proxy.
- `network service` — pick service used by `networksetup`.
- `Font-size` — change overlay text size.
- `Background transparency` — tune overlay opacity.
- `Hide` — hide the lyric window.
- `Always on Top` — toggle pin-on-top.
- `Exit Application` — quit app and unset proxy.

## NPM Scripts

- `npm start` — run app in development
- `npm run package` — package app only
- `npm run make` — build distributables
- `npm run publish` — build + publish release assets via Electron Forge publisher
- `npm run lint` — run ESLint

## Build Artifacts

After `npm run make`, outputs are in `out/make`.

Examples:

- `out/make/Spotify Lyrics Overlay-<version>-arm64.dmg`
- `out/make/zip/darwin/arm64/Spotify Lyrics Overlay-darwin-arm64-<version>.zip`

## Versioning

```bash
npm version patch --no-git-tag-version
# or: minor / major / 0.x.y
```

## GitHub Release Publishing

This repo is configured with `@electron-forge/publisher-github`.

Create `.env` in project root:

```env
GH_TOKEN=your_github_token
```

Then publish:

```bash
npm run publish
```

### GitHub Release Description Template

Copy and paste this into your GitHub Release notes:

```md
## Spotify Lyrics Overlay v<version>

### Install (macOS)
1. Download the `.dmg` (or `.zip`) from Assets.
2. Move `Spotify Lyrics Overlay.app` to `Applications`.
3. Open the app (if warned, right-click app -> Open -> Open).
4. Right-click lyric window and click `set cert`.
5. Start Spotify playback and keep Spotify Lyrics panel open.

If macOS still blocks launch, run:
`xattr -dr com.apple.quarantine "/Applications/Spotify Lyrics Overlay.app"`

### Notes
- This release currently supports macOS.
- If lyrics do not appear, use context menu: `set proxy` and verify `network service`.
```

## macOS Distribution (Gatekeeper)

### Recommended: signed + notarized release

To avoid “app is damaged” for end users, publish a signed and notarized build.

In `.env`:

```env
GH_TOKEN=your_github_token
APPLE_ID=your_apple_id
APPLE_APP_SPECIFIC_PASSWORD=app_specific_password
APPLE_TEAM_ID=your_team_id
```

Then run:

```bash
npm run publish
```

### Free path: unsigned distribution (manual trust required)

If distributing unsigned builds, users may need:

```bash
xattr -dr com.apple.quarantine "/Applications/Spotify Lyrics Overlay.app"
```

Then right-click app → `Open` → `Open`.

## Troubleshooting

### 1) “App is damaged and can’t be opened”

- Use notarized releases (recommended), or
- remove quarantine manually (unsigned flow).

### 2) No lyric updates

- Ensure Spotify is playing and Lyrics panel is open.
- Re-run `set cert`.
- Re-run `set proxy`.
- Switch `network service` in menu.

### 3) Proxy appears stuck after crash

Disable manually:

```bash
networksetup -setwebproxystate "Wi-Fi" off
networksetup -setsecurewebproxystate "Wi-Fi" off
```

Replace `Wi-Fi` with your active service name.

### 4) Extractor executable permission issue

```bash
chmod +x src/lyrics-extractor/extractor
```

## Project Structure

- `src/main.ts` — Electron main process (window/proxy/menu/lifecycle)
- `src/preload.ts` — secure IPC bridge
- `src/component/Lyrics.tsx` — lyric overlay renderer
- `src/lyrics-extractor/` — extractor binaries/scripts/cert helper
- `forge.config.ts` — packaging/publishing config

## Security Notes

- The app modifies system proxy settings while running.
- Certificate trust is required for local traffic interception.
- You can inspect the implementation in source before installing.

## License

MIT — see `LICENSE`.
