# Computer Graphics Boilerplate (Vite + TypeScript)

This project is a boilerplate for Computer Graphics assignments with a strict pixel-matrix rendering approach.

It uses:
- `Uint8ClampedArray` as the pixel buffer
- `ImageData` + `putImageData` to present pixels on canvas
- click/touch-first interaction for drawing and selection

No high-level canvas primitives are used for the drawing algorithms.

## Requirements

- Node.js 18+ (recommended)
- npm

## Getting Started

Install dependencies:

```bash
npm install
```

Run in development mode (Vite + HMR):

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Deploying to GitHub Pages

Vite needs a correct [**`base`**](https://vitejs.dev/config/shared-options.html#base) when the app is not at the domain root. GitHub **project** pages use `https://<user>.github.io/<repo>/`, so assets must load from `/<repo>/`.

### Option A — GitHub Actions (recommended)

1. Push this repo to GitHub (branch `main` or `master`; the workflow listens to both).
2. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions**.
3. Push a commit (or run the workflow manually). The site will be at  
   `https://<username>.github.io/<repository>/`.

The workflow sets `GITHUB_PAGES_BASE=/<repo>/` at build time. A `public/.nojekyll` file is included so GitHub Pages does not run Jekyll on the output.

**If your repo is `<username>.github.io`** (user/org site at `https://<username>.github.io/` with no subpath), edit `.github/workflows/deploy-pages.yml` and set:

```yaml
env:
  GITHUB_PAGES_BASE: /
```

**Test a production build locally** with the same base as GitHub:

```bash
GITHUB_PAGES_BASE=/your-repo-name/ npm run build
npx vite preview
```

Open the URL Vite prints; paths should load under `/your-repo-name/`.

### Option B — Manual `gh-pages` branch

```bash
GITHUB_PAGES_BASE=/your-repo-name/ npm run build
npx gh-pages -d dist
```

(Install `gh-pages` globally or use `npx gh-pages`.) Point Pages at the `gh-pages` branch in repo settings.

## Project Structure

```text
.
├── index.html
├── src
│   ├── Algorithms.ts
│   ├── CanvasManager.ts
│   ├── InputHandler.ts
│   ├── UIManager.ts
│   ├── main.ts
│   ├── styles.css
│   └── types.ts
├── tsconfig.json
└── vite.config.ts
```

### Module Responsibilities

- `CanvasManager.ts`
  - Owns the canvas context and pixel buffer.
  - Exposes `setPixel(x, y, color)` for direct pixel writes.
  - Exposes `clear()` and `present()` (`putImageData`) for frame updates.

- `Algorithms.ts`
  - Exports rasterization, clipping, and transformation functions used by the app.
  - Receives a pixel-writer callback to draw into `CanvasManager`.

- `InputHandler.ts`
  - Captures mouse and touch input on the canvas.
  - Converts browser coordinates to canvas pixel coordinates.

- `UIManager.ts`
  - Builds and manages sidebar controls.
  - Emits UI state updates (tool selection, clipping mode, transforms).
  - Emits clear action events.

- `main.ts`
  - Connects all modules.
  - Stores scene primitives (points, lines, circles).
  - Applies transforms/clipping according to UI state.
  - Runs the render loop and presents pixels when needed.

## Using the Application

## 1) Tool Selector

Choose one drawing mode in the sidebar:

- **Point**: each click/touch adds one point.
- **Line DDA**: click start point, then end point.
- **Line Bresenham**: click start point, then end point.
- **Circle**: click center, then click a point on the radius.
- **Selection**: click two corners to define a clipping rectangle.

## 2) Transformation Controls

Use sliders to control scene transformations:

- `dx`, `dy`: translation
- `angle`: rotation (degrees)
- `sx`, `sy`: scale factors

These values are applied during rendering and update the scene visually.

## 3) Clipping Toggle

Choose clipping strategy:

- `Cohen-Sutherland`
- `Liang-Barsky`

When a clipping rectangle exists (Selection tool), line primitives are clipped by the active method.

## 4) Clear Matrix

`Clear Matrix` removes all primitives and selection state, resetting the canvas content.

## Render Pipeline Overview

1. Input/UI changes set the scene state and mark redraw as needed.
2. `renderLoop` checks whether redraw is required.
3. On redraw:
   - pixel buffer is cleared
   - primitives are re-rendered through exported algorithm functions
   - updated frame is pushed with `putImageData`

This keeps rendering deterministic and fully pixel-buffer driven.

## Notes

- Canvas uses `image-rendering: pixelated` for crisp visual output.
- Touch input is enabled for click-heavy assignment interaction on touch devices.
- TypeScript strict mode is enabled for safer development.
