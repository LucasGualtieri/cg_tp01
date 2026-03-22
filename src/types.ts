export type Axis = "x" | "y" | "xy";
export type ClippingAlgorithm = "cohen-sutherland" | "liang-barsky";
export type LineAlgorithm = "dda" | "bresenham";
export type Tool = "point" | "line-dda" | "line-bresenham" | "circle" | "selection";

export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a?: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly xmin: number;
  readonly ymin: number;
  readonly xmax: number;
  readonly ymax: number;
}

export interface UIState {
  tool: Tool;
  clippingAlgorithm: ClippingAlgorithm;
  translation: Point;
  rotationDegrees: number;
  scale: Point;
  pixelSize: number;
  showGrid: boolean;
}
