import type { Axis, Color, Point, Rect } from "./types";

type PixelWriter = (x: number, y: number, color: Color) => void;

export function drawLineDDA(start: Point, end: Point, setPixel: PixelWriter, color: Color): void {

	const dx = end.x - start.x;
	const dy = end.y - start.y;

	const steps = Math.max(Math.abs(dx), Math.abs(dy));

	if (steps === 0) {
		setPixel(start.x, start.y, color);
		return;
	}

	const xIncrement = dx / steps;
	const yIncrement = dy / steps;

	let x = start.x, y = start.y;

	for (let i = 0; i <= steps; i++) {
		setPixel(x, y, color);
		x += xIncrement;
		y += yIncrement;
	}
}

export function drawLineBresenham(start: Point, end: Point, setPixel: PixelWriter, color: Color): void { }

export function drawCircleBresenham(center: Point, radius: number, setPixel: PixelWriter, color: Color): void { }

/** Stubs: return segment unchanged until I implement real clipping (otherwise lines vanish with a clip rect). */
export function clipCohenSutherland(start: Point, end: Point, _rect: Rect): { start: Point; end: Point } | null {
	return { start, end };
}

export function clipLiangBarsky(start: Point, end: Point, _rect: Rect): { start: Point; end: Point } | null {
	return { start, end };
}

export function translate(points: Point[], dx: number, dy: number): Point[] {
	return points.map(p => ({ x: p.x + dx, y: p.y + dy }));
}

/** Stubs: return points unchanged. **/
export function rotate(points: Point[], _angleDegrees: number, _pivot: Point = { x: 0, y: 0 }): Point[] {
	return points.map(p => ({ x: p.x, y: p.y }));
}

/** Stubs: return points unchanged. **/
export function scale(points: Point[], _sx: number, _sy: number, _pivot: Point = { x: 0, y: 0 }): Point[] {
	return points.map(p => ({ x: p.x, y: p.y }));
}

/** Stubs: return points unchanged. **/
export function reflect(points: Point[], axis: Axis, pivot: Point = { x: 0, y: 0 }): Point[] {
	return points.map(p => ({ x: p.x, y: p.y }));
}