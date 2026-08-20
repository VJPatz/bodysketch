# ◎ BodySketch

**Real-time 33-point body skeleton tracker — runs entirely in your browser. No server. No data collection. Just you and your stick figure, lit up.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00f0ff?style=flat-square)](https://vjpatz.github.io/bodysketch/)
[![License: MIT](https://img.shields.io/badge/License-MIT-39ff6a?style=flat-square)](./LICENSE)
[![YouTube](https://img.shields.io/badge/YouTube-Watch%20the%20Video-ff2ee6?style=flat-square&logo=youtube)](https://www.youtube.com/watch?v=M6xmis8RIX8)

![BodySketch demo screenshot](./demo.png)

---

## What it does

Open the page → hit **Play** → your skeleton lights up on screen in real time.

- 33 MediaPipe pose landmarks tracked per person
- Up to 4 people at once
- One Euro filter smoothing — to minimise jitter
- Works on desktop and mobile

---

## Privacy

**Your camera feed never leaves your device.**

- Zero server calls during tracking
- No video is recorded, stored, or transmitted
- The MediaPipe model runs entirely via WebAssembly in your browser
- No analytics, no cookies, no accounts

Verify it yourself: DevTools → Network tab → camera data never appears in any request.

---

## Tech stack

| Layer | Technology |
|---|---|
| Pose detection | [MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) (WASM, in-browser) |
| Framework | React 18 |
| Build tool | Vite |
| Smoothing | One Euro Filter |
| Deploy | GitHub Pages via GitHub Actions |

---

## Run locally

```bash
git clone https://github.com/VJPatz/bodysketch.git
cd bodysketch
npm install
npm run dev
```

Open [http://localhost:5173/bodysketch/](http://localhost:5173/bodysketch/)

Requires a modern browser with camera access (Chrome or Edge recommended for best WebAssembly performance).

---

## How it works

```
Camera feed (video element)
    ↓
MediaPipe Pose Landmarker (WASM, GPU delegate)
    ↓  33 landmarks × N people
PersonTracker  →  stable ID assignment across frames
    ↓
LandmarkSmoother  →  One Euro filter per landmark axis
    ↓
Canvas Renderer  →  neon skeleton on black background
```

---

## Configuration

All tunable values live in `src/lib/constants.js`:

```js
TRACKER_CONFIG = {
  maxPersons: 4,            // max simultaneous people
  maxDistance: 0.35,        // ID matching threshold (0–1 normalized)
  maxMissedFrames: 20,      // frames before a track is dropped
  minVisibleLandmarks: 8,   // quality gate
  minTorsoVisible: 2,       // requires core body structure
}

SMOOTHING_CONFIG = {
  minCutoff: 1.0,           // lower = smoother (more lag)
  beta: 0.007,              // higher = faster response to movement
}
```
---

## License

MIT — see [LICENSE](./LICENSE)

Use it, fork it, build on it. Attribution appreciated.

---

## Contributing

PRs welcome. Keep it focused — this is intentionally a minimal, readable project.

---

*Built with MediaPipe + React + Vite*
