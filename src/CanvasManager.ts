import type { Color } from "./types";

const BYTES_PER_PIXEL = 4;

export class CanvasManager {

	readonly width: number;
	readonly height: number;

	private readonly canvas: HTMLCanvasElement;
	private readonly context: CanvasRenderingContext2D;
	private readonly imageData: ImageData;
	private readonly pixelBuffer: Uint8ClampedArray;
	private pixelSize = 1;
	private showGrid = false;
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

	setPixelSize(size: number): void {
		this.pixelSize = Math.max(1, Math.floor(size));
		this.dirty = true;
	}

	canvasPixelToLogical(canvasX: number, canvasY: number): { x: number; y: number } {

		const ps = this.pixelSize;
		const lx = Math.floor(canvasX / ps);
		const ly = Math.floor(canvasY / ps);
		const lw = this.logicalWidth;
		const lh = this.logicalHeight;

		return {
			x: Math.min(Math.max(0, lx), Math.max(0, lw - 1)),
			y: Math.min(Math.max(0, ly), Math.max(0, lh - 1))
		};
	}

	setGridEnabled(enabled: boolean): void {
		this.showGrid = enabled;
		this.dirty = true;
	}

	clear(color: Color = { r: 20, g: 20, b: 24, a: 255 }): void {

		const alpha = color.a ?? 255;

		for (let index = 0; index < this.pixelBuffer.length; index += BYTES_PER_PIXEL) {
			this.pixelBuffer[index] = color.r;
			this.pixelBuffer[index + 1] = color.g;
			this.pixelBuffer[index + 2] = color.b;
			this.pixelBuffer[index + 3] = alpha;
		}

		if (this.showGrid && this.pixelSize > 1) {
			this.drawGridOverlay();
		}

		this.dirty = true;
	}

	setPixel(x: number, y: number, color: Color): void {

		const xi = Math.round(x);
		const yi = Math.round(y);

		if (xi < 0 || yi < 0 || xi >= this.logicalWidth || yi >= this.logicalHeight) {
			return;
		}

		const baseX = xi * this.pixelSize;
		const baseY = yi * this.pixelSize;
		const alpha = color.a ?? 255;

		for (let oy = 0; oy < this.pixelSize; oy++) {
			for (let ox = 0; ox < this.pixelSize; ox++) {

				const px = baseX + ox;
				const py = baseY + oy;

				if (px >= this.width || py >= this.height) continue;

				const idx = (py * this.width + px) * BYTES_PER_PIXEL;
				this.pixelBuffer[idx] = color.r;
				this.pixelBuffer[idx + 1] = color.g;
				this.pixelBuffer[idx + 2] = color.b;
				this.pixelBuffer[idx + 3] = alpha;
			}
		}

		this.dirty = true;
	}

	present(): void {

		if (!this.dirty) return;

		this.context.putImageData(this.imageData, 0, 0);
		this.dirty = false;
	}

	private get logicalWidth(): number {
		return Math.floor(this.width / this.pixelSize);
	}

	private get logicalHeight(): number {
		return Math.floor(this.height / this.pixelSize);
	}

	private drawGridOverlay(): void {

		const grid = { r: 45, g: 49, b: 59, a: 255 };

		for (let x = this.pixelSize; x < this.width; x += this.pixelSize) {
			for (let y = 0; y < this.height; y++) {
				const idx = (y * this.width + x) * BYTES_PER_PIXEL;
				this.pixelBuffer[idx] = grid.r;
				this.pixelBuffer[idx + 1] = grid.g;
				this.pixelBuffer[idx + 2] = grid.b;
				this.pixelBuffer[idx + 3] = grid.a;
			}
		}

		for (let y = this.pixelSize; y < this.height; y += this.pixelSize) {
			for (let x = 0; x < this.width; x++) {
				const idx = (y * this.width + x) * BYTES_PER_PIXEL;
				this.pixelBuffer[idx] = grid.r;
				this.pixelBuffer[idx + 1] = grid.g;
				this.pixelBuffer[idx + 2] = grid.b;
				this.pixelBuffer[idx + 3] = grid.a;
			}
		}
	}
}