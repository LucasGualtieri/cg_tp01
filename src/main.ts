import {
	clipCohenSutherland,
	clipLiangBarsky,
	drawCircleBresenham,
	drawLineBresenham,
	drawLineDDA
} from "./Algorithms";

import "./styles.css";
import { CanvasManager } from "./CanvasManager";
import { rotationScaleMatFromUIState, transformVectorIJ } from "./Homogeneous2D";
import { InputHandler } from "./InputHandler";
import { UIManager, isLineTool, lineAlgorithmFromTool } from "./UIManager";
import type { ClippingAlgorithm, LineAlgorithm, Point, Rect, UIState, VectorIJ } from "./types";
import { vectorIJToPoint } from "./types";

type Primitive =
	| { type: "point"; point: VectorIJ }
	| { type: "line"; algorithm: LineAlgorithm; start: VectorIJ; end: VectorIJ }
	| { type: "circle"; center: VectorIJ; radius: number };

const COLORS = {
	point: { r: 255, g: 190, b: 92, a: 255 },
	line: { r: 103, g: 183, b: 255, a: 255 },
	circle: { r: 95, g: 230, b: 146, a: 255 },
	clip: { r: 255, g: 121, b: 121, a: 255 }
} as const;

// Temporary markers (first click / second click preview).
// Change this color here if you want different highlight colors.
const PREVIEW_MARKER_COLOR = { r: 255, g: 255, b: 255, a: 255 };
const PREVIEW_VISIBLE_MS = 500;

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
const pendingPoints: VectorIJ[] = [];
const previewPoints: VectorIJ[] = [];
let previewTimeoutId: number | null = null;
let needsRedraw = true;

uiManager.onStateUpdated((state) => {
	uiState = state;
	canvasManager.setPixelSize(uiState.pixelSize);
	canvasManager.setGridEnabled(uiState.showGrid);
	canvasManager.syncViewFromUIState(uiState);
	requestRedraw();
});

uiManager.onClear(() => {
	primitives.length = 0;
	pendingPoints.length = 0;
	previewPoints.length = 0;
	if (previewTimeoutId !== null) {
		window.clearTimeout(previewTimeoutId);
		previewTimeoutId = null;
	}
	clipRect = null;
	requestRedraw();
});

inputHandler.onPoint((point) => {
	// Floor to logical cell so cursor hits match the block grid (Math.round would
	// mis-map e.g. center of first cell when pixelSize > 1).
	const logicalPoint: Point = canvasManager.canvasPixelToLogical(point.x, point.y);
	handleCanvasPoint(logicalPoint);
});

canvasManager.setPixelSize(uiState.pixelSize);
canvasManager.setGridEnabled(uiState.showGrid);
canvasManager.syncViewFromUIState(uiState);

function requestRedraw(): void {
	needsRedraw = true;
}

function handleCanvasPoint(logical: Point): void {

	const point: VectorIJ = { i: logical.x, j: logical.y };
	const tool = uiState.tool;

	if (tool === "point") {
		primitives.push({ type: "point", point });
		requestRedraw();
		return;
	}

	// While the two-click preview is visible, ignore extra clicks.
	if (pendingPoints.length >= 2) return;

	// First click (start): show one preview marker.
	if (pendingPoints.length === 0) {
		pendingPoints.push(point);
		previewPoints.push(point);
		requestRedraw();
		return;
	}

	// Second click: show both preview markers, finalize primitive, then hide both.
	const first = pendingPoints[0];
	pendingPoints.push(point);
	previewPoints.push(point);

	if (isLineTool(tool)) {
		primitives.push({
			type: "line",
			algorithm: lineAlgorithmFromTool(tool),
			start: first,
			end: point
		});
	} else if (tool === "circle") {
		const radius = Math.hypot(point.i - first.i, point.j - first.j);
		primitives.push({ type: "circle", center: first, radius });
	} else if (tool === "selection") {
		clipRect = normalizeRect(first, point);
	}

	requestRedraw();

	if (previewTimeoutId !== null) {
		window.clearTimeout(previewTimeoutId);
	}
	previewTimeoutId = window.setTimeout(() => {
		pendingPoints.length = 0;
		previewPoints.length = 0;
		previewTimeoutId = null;
		requestRedraw();
	}, PREVIEW_VISIBLE_MS);
}

function normalizeRect(a: VectorIJ, b: VectorIJ): Rect {
	return {
		xmin: Math.min(a.i, b.i),
		xmax: Math.max(a.i, b.i),
		ymin: Math.min(a.j, b.j),
		ymax: Math.max(a.j, b.j)
	};
}

/** p_screen = R·S·(p + t): translation in model space first, then rotate & scale about the fixed world origin (axis cross). */
function transformPoints(vectors: VectorIJ[]): VectorIJ[] {
	const rs = rotationScaleMatFromUIState(uiState);
	const tx = uiState.translation.x;
	const ty = uiState.translation.y;
	return vectors.map((v) =>
		transformVectorIJ(rs, { i: v.i + tx, j: v.j + ty })
	);
}

function drawTransformedLine(
	start: VectorIJ,
	end: VectorIJ,
	algorithm: LineAlgorithm,
	clippingAlgorithm: ClippingAlgorithm
): void {

	let drawStart = start;
	let drawEnd = end;

	if (clipRect) {
		const clipped =
			clippingAlgorithm === "cohen-sutherland"
				? clipCohenSutherland(vectorIJToPoint(start), vectorIJToPoint(end), clipRect)
				: clipLiangBarsky(vectorIJToPoint(start), vectorIJToPoint(end), clipRect);

		if (!clipped) return;

		drawStart = { i: clipped.start.x, j: clipped.start.y };
		drawEnd = { i: clipped.end.x, j: clipped.end.y };
	}

	const transformed = transformPoints([drawStart, drawEnd]);
	const transformedStart = vectorIJToPoint(transformed[0]);
	const transformedEnd = vectorIJToPoint(transformed[1]);

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

	canvasManager.syncViewFromUIState(uiState);
	canvasManager.clear();

	for (const primitive of primitives) {

		if (primitive.type === "point") {
			const [point] = transformPoints([primitive.point]);
			canvasManager.setPixel(point.i, point.j, COLORS.point);
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
			vectorIJToPoint(center),
			primitive.radius * averageScale,
			canvasManager.setPixel.bind(canvasManager),
			COLORS.circle
		);
	}

	if (clipRect) {

		const clipCorners = transformPoints([
			{ i: clipRect.xmin, j: clipRect.ymin },
			{ i: clipRect.xmax, j: clipRect.ymin },
			{ i: clipRect.xmax, j: clipRect.ymax },
			{ i: clipRect.xmin, j: clipRect.ymax }
		]);
		const toP = vectorIJToPoint;

		drawLineBresenham(
			toP(clipCorners[0]),
			toP(clipCorners[1]),
			canvasManager.setPixel.bind(canvasManager),
			COLORS.clip
		);

		drawLineBresenham(
			toP(clipCorners[1]),
			toP(clipCorners[2]),
			canvasManager.setPixel.bind(canvasManager),
			COLORS.clip
		);

		drawLineBresenham(
			toP(clipCorners[2]),
			toP(clipCorners[3]),
			canvasManager.setPixel.bind(canvasManager),
			COLORS.clip
		);

		drawLineBresenham(
			toP(clipCorners[3]),
			toP(clipCorners[0]),
			canvasManager.setPixel.bind(canvasManager),
			COLORS.clip
		);
	}

	for (const p of transformPoints(previewPoints)) {
		canvasManager.setPixel(p.i, p.j, PREVIEW_MARKER_COLOR);
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