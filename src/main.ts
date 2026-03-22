import "./styles.css";
import {
  clipCohenSutherland,
  clipLiangBarsky,
  drawCircleBresenham,
  drawLineBresenham,
  drawLineDDA,
  rotate,
  scale,
  translate
} from "./AlgorithmsImplemented";
import { CanvasManager } from "./CanvasManager";
import { InputHandler } from "./InputHandler";
import { UIManager, isLineTool, lineAlgorithmFromTool, midpoint } from "./UIManager";
import type { ClippingAlgorithm, LineAlgorithm, Point, Rect, Tool, UIState } from "./types";

type Primitive =
  | { type: "point"; point: Point }
  | { type: "line"; algorithm: LineAlgorithm; start: Point; end: Point }
  | { type: "circle"; center: Point; radius: number };

const COLORS = {
  point: { r: 255, g: 190, b: 92, a: 255 },
  line: { r: 103, g: 183, b: 255, a: 255 },
  circle: { r: 95, g: 230, b: 146, a: 255 },
  clip: { r: 255, g: 121, b: 121, a: 255 }
} as const;

const canvasElement = document.querySelector<HTMLCanvasElement>("#pixel-canvas");
const sidebar = document.querySelector<HTMLElement>("#sidebar");

if (!canvasElement || !sidebar) {
  throw new Error("App root elements not found.");
}

const canvasManager = new CanvasManager(canvasElement);
const inputHandler = new InputHandler(canvasManager.getElement());
const uiManager = new UIManager(sidebar);

let uiState: UIState = uiManager.getState();
let clipRect: Rect | null = null;
const primitives: Primitive[] = [];
const pendingPoints: Point[] = [];
let needsRedraw = true;

uiManager.onStateUpdated((state) => {
  uiState = state;
  requestRedraw();
});

uiManager.onClear(() => {
  primitives.length = 0;
  pendingPoints.length = 0;
  clipRect = null;
  requestRedraw();
});

inputHandler.onPoint((point) => {
  handleCanvasPoint(point, uiState.tool);
});

function requestRedraw(): void {
  needsRedraw = true;
}

function handleCanvasPoint(point: Point, tool: Tool): void {
  if (tool === "point") {
    primitives.push({ type: "point", point });
    requestRedraw();
    return;
  }

  pendingPoints.push(point);

  if (isLineTool(tool) && pendingPoints.length === 2) {
    const [start, end] = pendingPoints;
    primitives.push({
      type: "line",
      algorithm: lineAlgorithmFromTool(tool),
      start,
      end
    });
    pendingPoints.length = 0;
  } else if (tool === "circle" && pendingPoints.length === 2) {
    const [center, edge] = pendingPoints;
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
    primitives.push({ type: "circle", center, radius });
    pendingPoints.length = 0;
  } else if (tool === "selection" && pendingPoints.length === 2) {
    const [a, b] = pendingPoints;
    clipRect = normalizeRect(a, b);
    pendingPoints.length = 0;
  }

  requestRedraw();
}

function normalizeRect(a: Point, b: Point): Rect {
  return {
    xmin: Math.min(a.x, b.x),
    xmax: Math.max(a.x, b.x),
    ymin: Math.min(a.y, b.y),
    ymax: Math.max(a.y, b.y)
  };
}

function transformPoints(points: Point[]): Point[] {
  const pivot = midpoint(points);
  return translate(
    rotate(scale(points, uiState.scale.x, uiState.scale.y, pivot), uiState.rotationDegrees, pivot),
    uiState.translation.x,
    uiState.translation.y
  );
}

function drawTransformedLine(
  start: Point,
  end: Point,
  algorithm: LineAlgorithm,
  clippingAlgorithm: ClippingAlgorithm
): void {
  let transformedStart = start;
  let transformedEnd = end;
  const transformed = transformPoints([start, end]);
  transformedStart = transformed[0];
  transformedEnd = transformed[1];

  if (clipRect) {
    const clipped =
      clippingAlgorithm === "cohen-sutherland"
        ? clipCohenSutherland(transformedStart, transformedEnd, clipRect)
        : clipLiangBarsky(transformedStart, transformedEnd, clipRect);

    if (!clipped) {
      return;
    }

    transformedStart = clipped.start;
    transformedEnd = clipped.end;
  }

  if (algorithm === "dda") {
    drawLineDDA(transformedStart, transformedEnd, canvasManager.setPixel.bind(canvasManager), COLORS.line);
    return;
  }

  drawLineBresenham(
    transformedStart,
    transformedEnd,
    canvasManager.setPixel.bind(canvasManager),
    COLORS.line
  );
}

function redrawScene(): void {
  canvasManager.clear();

  for (const primitive of primitives) {
    if (primitive.type === "point") {
      const [point] = transformPoints([primitive.point]);
      canvasManager.setPixel(point.x, point.y, COLORS.point);
      continue;
    }

    if (primitive.type === "line") {
      drawTransformedLine(
        primitive.start,
        primitive.end,
        primitive.algorithm,
        uiState.clippingAlgorithm
      );
      continue;
    }

    const [center] = transformPoints([primitive.center]);
    const averageScale = (Math.abs(uiState.scale.x) + Math.abs(uiState.scale.y)) / 2;
    drawCircleBresenham(
      center,
      primitive.radius * averageScale,
      canvasManager.setPixel.bind(canvasManager),
      COLORS.circle
    );
  }

  if (clipRect) {
    drawLineBresenham(
      { x: clipRect.xmin, y: clipRect.ymin },
      { x: clipRect.xmax, y: clipRect.ymin },
      canvasManager.setPixel.bind(canvasManager),
      COLORS.clip
    );
    drawLineBresenham(
      { x: clipRect.xmax, y: clipRect.ymin },
      { x: clipRect.xmax, y: clipRect.ymax },
      canvasManager.setPixel.bind(canvasManager),
      COLORS.clip
    );
    drawLineBresenham(
      { x: clipRect.xmax, y: clipRect.ymax },
      { x: clipRect.xmin, y: clipRect.ymax },
      canvasManager.setPixel.bind(canvasManager),
      COLORS.clip
    );
    drawLineBresenham(
      { x: clipRect.xmin, y: clipRect.ymax },
      { x: clipRect.xmin, y: clipRect.ymin },
      canvasManager.setPixel.bind(canvasManager),
      COLORS.clip
    );
  }
}

function renderLoop(): void {
  if (needsRedraw) {
    redrawScene();
    canvasManager.present();
    needsRedraw = false;
  }
  requestAnimationFrame(renderLoop);
}

renderLoop();
