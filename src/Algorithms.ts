import type { Axis, Color, Point, Rect } from "./types";

type PixelWriter = (x: number, y: number, color: Color) => void;

const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

export function drawLineDDA(start: Point, end: Point, setPixel: PixelWriter, color: Color): void {
}

export function drawLineBresenham(start: Point, end: Point, setPixel: PixelWriter, color: Color): void {
}

export function drawCircleBresenham(center: Point, radius: number, setPixel: PixelWriter, color: Color): void {
}

export function clipCohenSutherland(start: Point, end: Point, rect: Rect): { start: Point; end: Point } | null {
	return null;
}

export function clipLiangBarsky(start: Point, end: Point, rect: Rect): { start: Point; end: Point } | null {
	return null;
}

export function translate(points: Point[], dx: number, dy: number): Point[] {
	return points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
}

export function rotate(points: Point[], angleDegrees: number, pivot: Point = { x: 0, y: 0 }): Point[] {
	return [];
}

export function scale(points: Point[], sx: number, sy: number, pivot: Point = { x: 0, y: 0 }): Point[] {
	return [];
}

export function reflect(points: Point[], axis: Axis, pivot: Point = { x: 0, y: 0 }): Point[] {
	return []
}