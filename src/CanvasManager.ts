import type { Color } from "./types";

const BYTES_PER_PIXEL = 4;

export class CanvasManager {
  readonly width: number;
  readonly height: number;

  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly imageData: ImageData;
  private readonly pixelBuffer: Uint8ClampedArray;
  private dirty = true;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Unable to initialize 2D canvas context.");
    }

    this.canvas = canvas;
    this.context = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this.imageData = context.createImageData(this.width, this.height);
    this.pixelBuffer = this.imageData.data;
    this.clear();
  }

  getElement(): HTMLCanvasElement {
    return this.canvas;
  }

  clear(color: Color = { r: 20, g: 20, b: 24, a: 255 }): void {
    const alpha = color.a ?? 255;
    for (let index = 0; index < this.pixelBuffer.length; index += BYTES_PER_PIXEL) {
      this.pixelBuffer[index] = color.r;
      this.pixelBuffer[index + 1] = color.g;
      this.pixelBuffer[index + 2] = color.b;
      this.pixelBuffer[index + 3] = alpha;
    }
    this.dirty = true;
  }

  setPixel(x: number, y: number, color: Color): void {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= this.width || yi >= this.height) {
      return;
    }

    const idx = (yi * this.width + xi) * BYTES_PER_PIXEL;
    this.pixelBuffer[idx] = color.r;
    this.pixelBuffer[idx + 1] = color.g;
    this.pixelBuffer[idx + 2] = color.b;
    this.pixelBuffer[idx + 3] = color.a ?? 255;
    this.dirty = true;
  }

  present(): void {
    if (!this.dirty) {
      return;
    }
    this.context.putImageData(this.imageData, 0, 0);
    this.dirty = false;
  }
}
