import type { Axis, Color, Point, Rect } from "./types";

type PixelWriter = (x: number, y: number, color: Color) => void;

const TOP = 0b1000;
const BOTTOM = 0b0100;
const RIGHT = 0b0010;
const LEFT = 0b0001;
const INSIDE = 0b0000;

function computeOutCode(point: Point, rect: Rect): number {
	let code = INSIDE;
	if (point.x < rect.xmin) code |= LEFT;
	else if (point.x > rect.xmax) code |= RIGHT;
	if (point.y < rect.ymin) code |= TOP;
	else if (point.y > rect.ymax) code |= BOTTOM;
	return code;
}

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
	let x = start.x;
	let y = start.y;

	for (let i = 0; i <= steps; i++) {
		setPixel(x, y, color);
		x += xIncrement;
		y += yIncrement;
	}
}

export function drawLineBresenham(start: Point, end: Point, setPixel: PixelWriter, color: Color): void {
	let x0 = Math.round(start.x);
	let y0 = Math.round(start.y);
	const x1 = Math.round(end.x);
	const y1 = Math.round(end.y);

	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;

	let D = dx - dy;

	while (true) {
		setPixel(x0, y0, color);

		if (x0 === x1 && y0 === y1) break;

		const doubleError = 2 * D;

		if (doubleError > -dy) {
			D -= dy;
			x0 += sx;
		}

		if (doubleError < dx) {
			D += dx;
			y0 += sy;
		}
	}
}

export function drawCircleBresenham(center: Point, radius: number, setPixel: PixelWriter, color: Color): void {
	const xc = Math.round(center.x);
	const yc = Math.round(center.y);

	let x = 0;
	let y = Math.max(0, Math.round(radius));
	let decision = 3 - 2 * y;

	while (x <= y) {
		setPixel(xc + x, yc + y, color);
		setPixel(xc - x, yc + y, color);
		setPixel(xc + x, yc - y, color);
		setPixel(xc - x, yc - y, color);
		setPixel(xc + y, yc + x, color);
		setPixel(xc - y, yc + x, color);
		setPixel(xc + y, yc - x, color);
		setPixel(xc - y, yc - x, color);

		x++;

		if (decision > 0) {
			y -= 1;
			decision += 4 * (x - y) + 10;
		} else {
			decision += 4 * x + 6;
		}
	}
}

export function clipCohenSutherland(start: Point, end: Point, rect: Rect): { start: Point; end: Point } | null {
	let p0: Point = { ...start };
	let p1: Point = { ...end };
	let outCode0 = computeOutCode(p0, rect);
	let outCode1 = computeOutCode(p1, rect);

	while (true) {
		if ((outCode0 | outCode1) === 0) {
			return {
				start: p0,
				end: p1
			};
		}

		if ((outCode0 & outCode1) !== 0) {
			return null;
		}

		const outCodeOut = outCode0 !== 0 ? outCode0 : outCode1;

		let x = 0;
		let y = 0;

		if ((outCodeOut & TOP) !== 0) {
			x = p0.x + ((p1.x - p0.x) * (rect.ymin - p0.y)) / (p1.y - p0.y);
			y = rect.ymin;
		} else if ((outCodeOut & BOTTOM) !== 0) {
			x = p0.x + ((p1.x - p0.x) * (rect.ymax - p0.y)) / (p1.y - p0.y);
			y = rect.ymax;
		} else if ((outCodeOut & RIGHT) !== 0) {
			y = p0.y + ((p1.y - p0.y) * (rect.xmax - p0.x)) / (p1.x - p0.x);
			x = rect.xmax;
		} else if ((outCodeOut & LEFT) !== 0) {
			y = p0.y + ((p1.y - p0.y) * (rect.xmin - p0.x)) / (p1.x - p0.x);
			x = rect.xmin;
		}

		if (outCodeOut === outCode0) {
			p0 = { x, y };
			outCode0 = computeOutCode(p0, rect);
		} else {
			p1 = { x, y };
			outCode1 = computeOutCode(p1, rect);
		}
	}
}

export function clipLiangBarsky(start: Point, end: Point, rect: Rect): { start: Point; end: Point } | null {
	const dx = end.x - start.x;
	const dy = end.y - start.y;

	const p = [-dx, dx, -dy, dy];
	const q = [start.x - rect.xmin, rect.xmax - start.x, start.y - rect.ymin, rect.ymax - start.y];

	let u1 = 0;
	let u2 = 1;

	for (let i = 0; i < p.length; i++) {
		const pi = p[i];
		const qi = q[i];

		if (pi === 0 && qi < 0) return null;
		if (pi === 0) continue;

		const t = qi / pi;

		if (pi < 0) {
			u1 = Math.max(u1, t);
		} else {
			u2 = Math.min(u2, t);
		}
	}

	if (u1 > u2) return null;

	return {
		start: { x: start.x + u1 * dx, y: start.y + u1 * dy },
		end: { x: start.x + u2 * dx, y: start.y + u2 * dy }
	};
}

export function translate(points: Point[], dx: number, dy: number): Point[] {
	return points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
}

export function rotate(points: Point[], angleDegrees: number, pivot: Point = { x: 0, y: 0 }): Point[] {
	const angle = (angleDegrees * Math.PI) / 180;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);

	return points.map((point) => {
		const translatedX = point.x - pivot.x;
		const translatedY = point.y - pivot.y;
		return {
			x: translatedX * cos - translatedY * sin + pivot.x,
			y: translatedX * sin + translatedY * cos + pivot.y
		};
	});
}

export function scale(points: Point[], sx: number, sy: number, pivot: Point = { x: 0, y: 0 }): Point[] {
	return points.map((point) => ({
		x: pivot.x + (point.x - pivot.x) * sx,
		y: pivot.y + (point.y - pivot.y) * sy
	}));
}

export function reflect(points: Point[], axis: Axis, pivot: Point = { x: 0, y: 0 }): Point[] {
	return points.map((point) => {
		if (axis === "x") {
			return { x: point.x, y: pivot.y - (point.y - pivot.y) };
		}

		if (axis === "y") {
			return { x: pivot.x - (point.x - pivot.x), y: point.y };
		}

		return {
			x: pivot.x - (point.x - pivot.x),
			y: pivot.y - (point.y - pivot.y)
		};
	});
}
