import type { ClippingAlgorithm, LineAlgorithm, Point, Tool, UIState } from "./types";

type UIStateListener = (state: UIState) => void;
type SimpleListener = () => void;

export class UIManager {
  private readonly root: HTMLElement;
  private readonly state: UIState = {
    tool: "point",
    clippingAlgorithm: "cohen-sutherland",
    translation: { x: 0, y: 0 },
    rotationDegrees: 0,
    scale: { x: 1, y: 1 },
    pixelSize: 1,
    showGrid: false
  };

  private onStateChange: UIStateListener | null = null;
  private onClearClick: SimpleListener | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.render();
    this.bindEvents();
  }

  getState(): UIState {
    return {
      ...this.state,
      translation: { ...this.state.translation },
      scale: { ...this.state.scale }
    };
  }

  onStateUpdated(listener: UIStateListener): void {
    this.onStateChange = listener;
  }

  onClear(listener: SimpleListener): void {
    this.onClearClick = listener;
  }

  private render(): void {
    this.root.innerHTML = `
      <h1>CG Boilerplate</h1>

      <section class="panel">
        <h2>Tool Selector</h2>
        <div class="tool-grid">
          <button data-tool="point" class="tool active">Point</button>
          <button data-tool="line-dda" class="tool">Line DDA</button>
          <button data-tool="line-bresenham" class="tool">Line Bresenham</button>
          <button data-tool="circle" class="tool">Circle</button>
          <button data-tool="selection" class="tool">Selection</button>
        </div>
      </section>

      <section class="panel">
        <h2>Transformations</h2>
        <label>dx: <span id="dx-value">0</span></label>
        <input id="dx-slider" type="range" min="-200" max="200" value="0" />
        <label>dy: <span id="dy-value">0</span></label>
        <input id="dy-slider" type="range" min="-200" max="200" value="0" />
        <label>angle: <span id="angle-value">0</span></label>
        <input id="angle-slider" type="range" min="-180" max="180" value="0" />
        <label>sx: <span id="sx-value">1.00</span></label>
        <input id="sx-slider" type="range" min="25" max="300" value="100" />
        <label>sy: <span id="sy-value">1.00</span></label>
        <input id="sy-slider" type="range" min="25" max="300" value="100" />
      </section>

      <section class="panel">
        <h2>Clipping</h2>
        <div class="tool-grid">
          <button data-clipping="cohen-sutherland" class="clip active">Cohen-Sutherland</button>
          <button data-clipping="liang-barsky" class="clip">Liang-Barsky</button>
        </div>
      </section>

      <section class="panel">
        <h2>Display</h2>
        <label>pixel size: <span id="pixel-size-value">1</span></label>
        <input id="pixel-size-slider" type="range" min="1" max="14" value="1" />
        <button id="grid-toggle" class="toggle">Grid: Off</button>
      </section>

      <section class="panel">
        <button id="clear-btn" class="danger">Clear Matrix</button>
      </section>
    `;
  }

  private bindEvents(): void {
    this.root.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        this.state.tool = button.dataset.tool as Tool;
        this.setActiveTool(this.state.tool);
        this.emitState();
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-clipping]").forEach((button) => {
      button.addEventListener("click", () => {
        this.state.clippingAlgorithm = button.dataset.clipping as ClippingAlgorithm;
        this.setActiveClipping(this.state.clippingAlgorithm);
        this.emitState();
      });
    });

    this.bindRange("dx-slider", "dx-value", (value) => {
      this.state.translation = { ...this.state.translation, x: value };
    });
    this.bindRange("dy-slider", "dy-value", (value) => {
      this.state.translation = { ...this.state.translation, y: value };
    });
    this.bindRange("angle-slider", "angle-value", (value) => {
      this.state.rotationDegrees = value;
    });
    this.bindRange("sx-slider", "sx-value", (value) => {
      this.state.scale = { ...this.state.scale, x: value / 100 };
    }, (value) => value.toFixed(2));
    this.bindRange("sy-slider", "sy-value", (value) => {
      this.state.scale = { ...this.state.scale, y: value / 100 };
    }, (value) => value.toFixed(2));
    this.bindRange("pixel-size-slider", "pixel-size-value", (value) => {
      this.state.pixelSize = Math.max(1, Math.floor(value));
    });

    const gridToggleButton = this.root.querySelector<HTMLButtonElement>("#grid-toggle");
    gridToggleButton?.addEventListener("click", () => {
      this.state.showGrid = !this.state.showGrid;
      this.updateGridButton();
      this.emitState();
    });
    this.updateGridButton();

    const clearButton = this.root.querySelector<HTMLButtonElement>("#clear-btn");
    clearButton?.addEventListener("click", () => {
      this.onClearClick?.();
    });
  }

  private bindRange(
    sliderId: string,
    labelId: string,
    onChange: (value: number) => void,
    format: (value: number) => string = (value) => String(value)
  ): void {
    const slider = this.root.querySelector<HTMLInputElement>(`#${sliderId}`);
    const label = this.root.querySelector<HTMLElement>(`#${labelId}`);

    if (!slider || !label) {
      return;
    }

    const update = (): void => {
      const parsed = Number(slider.value);
      onChange(parsed);
      label.textContent = format(sliderId.startsWith("s") ? parsed / 100 : parsed);
      this.emitState();
    };

    slider.addEventListener("input", update);
    update();
  }

  private setActiveTool(activeTool: Tool): void {
    this.root.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((button) => {
      button.classList.toggle("active", button.dataset.tool === activeTool);
    });
  }

  private setActiveClipping(active: ClippingAlgorithm): void {
    this.root.querySelectorAll<HTMLButtonElement>("[data-clipping]").forEach((button) => {
      button.classList.toggle("active", button.dataset.clipping === active);
    });
  }

  private emitState(): void {
    this.onStateChange?.(this.getState());
  }

  private updateGridButton(): void {
    const button = this.root.querySelector<HTMLButtonElement>("#grid-toggle");
    if (!button) {
      return;
    }

    button.textContent = `Grid: ${this.state.showGrid ? "On" : "Off"}`;
    button.classList.toggle("active", this.state.showGrid);
  }
}

export function isLineTool(tool: Tool): tool is "line-dda" | "line-bresenham" {
  return tool === "line-dda" || tool === "line-bresenham";
}

export function lineAlgorithmFromTool(tool: Tool): LineAlgorithm {
  return tool === "line-dda" ? "dda" : "bresenham";
}

export function midpoint(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  const total = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  return { x: total.x / points.length, y: total.y / points.length };
}
