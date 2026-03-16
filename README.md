# Spotify Overlap Lyrics
<p align="center">
  <img src="/src/assets/logoP.png" alt="Data Screenshot" width="200">
</p>
An always-on-top, synchronized lyrics overlay application for Spotify. 

## HOW TO USE IT

### First time opent he application

1. Go to the **"release"** page on the right side, over there you will find the newest realeased version, then download and unzip the file to your computer
2. You could drag the app to the /app folder if you want. Open the app for the first time, it should ask you for installing proxyman CA into your system. This is necessary for app to run and is completely safe since the service is provided by proxyman. Follow the instuction inside the app.
3. Once you install the CA, the app should auto config the network service. If it doesn't, you should restart the app or do it manually by right click the lyric display area and select the correct network service.
4. Open your spotify, and start playing song. **At the mean time, you should keep the "lyrice" on by click on the spotify "lyric" button.** This is nessary for app to run. If No lyric display in the display window, try to click on any of the lyric in spotify lyric page, this will refresh the database. 

## Features

- **Always On Top**: The lyrics window stays above your other applications, allowing you to follow along with the music without interrupting your workflow.
- **Time-Synced Lyrics**: Captures and displays lyrics in real-time, perfectly synchronized with your current Spotify track.
- **Unobtrusive Design**: A frameless, transparent overlay that blends seamlessly into your desktop environment.

## Tech Stack

This project bridges web technologies and network interception to deliver a smooth desktop experience:

- **Frontend/UI**: React and TypeScript, bundled with Vite for fast, optimized rendering.
- **Desktop Application**: Electron, responsible for managing the transparent, always-on-top window.
- **Data Extraction**: Python and `mitmproxy`. Rather than relying on third-party APIs that may lack timing data, the app intercepts Spotify's network traffic to capture the raw, time-synced lyrics payload.

## How It Works

1. **Proxy Configuration**: Custom Python scripts (`setProxy_bin`, `unsetProxy_bin`) configure the local system proxy.
2. **Traffic Interception**: An `extractor` script running via `mitmproxy` listens for specific Spotify web traffic and isolates the JSON payloads containing the lyrics.
3. **IPC Communication**: The extracted lyrics are piped to the Electron main process and sent to the React renderer via Inter-Process Communication (IPC), where the UI updates smoothly as the song progresses.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Python 3.x](https://www.python.org/) (if you need to rebuild the proxy binaries)
- Spotify Desktop Client

## Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/LJaeson/spotify-overlap-lyrics.git](https://github.com/LJaeson/spotify-overlap-lyrics.git)
   cd spotify-overlap-lyrics
