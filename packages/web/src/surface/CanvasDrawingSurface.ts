import type { DrawingSurface, Point, Rect, Size, StrokeStyle, TextStyle } from "@video-player-ui/core";

/**
 * {@link DrawingSurface} over a 2D canvas, sharp on high-density screens.
 */
export class CanvasDrawingSurface implements DrawingSurface {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private currentSize: Size = { width: 0, height: 0 };

  /**
   * Bind the surface to a canvas.
   *
   * @param canvas - Canvas to draw on.
   * @throws Error When the browser provides no 2D context.
   */
  constructor(canvas: HTMLCanvasElement) {
    const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (context === null) {
      throw new Error("The browser provides no 2D canvas context");
    }
    this.canvas = canvas;
    this.context = context;
  }

  get size(): Size {
    return this.currentSize;
  }

  /**
   * Match the backing store to the displayed size.
   *
   * @param size - Displayed size in CSS pixels.
   * @param pixelRatio - Device pixels per CSS pixel.
   */
  resize(size: Size, pixelRatio: number): void {
    this.currentSize = size;
    this.canvas.width = Math.max(1, Math.round(size.width * pixelRatio));
    this.canvas.height = Math.max(1, Math.round(size.height * pixelRatio));
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  clear(): void {
    this.context.clearRect(0, 0, this.currentSize.width, this.currentSize.height);
  }

  save(): void {
    this.context.save();
  }

  restore(): void {
    this.context.restore();
  }

  multiplyOpacity(factor: number): void {
    this.context.globalAlpha *= factor;
  }

  strokeRect(rect: Rect, stroke: StrokeStyle): void {
    this.applyStroke(stroke);
    this.context.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }

  fillRect(rect: Rect, color: string): void {
    this.context.fillStyle = color;
    this.context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }

  strokePolyline(points: readonly Point[], isClosed: boolean, stroke: StrokeStyle): void {
    if (this.tracePath(points, isClosed)) {
      this.applyStroke(stroke);
      this.context.stroke();
    }
  }

  fillPolygon(points: readonly Point[], color: string): void {
    if (this.tracePath(points, true)) {
      this.context.fillStyle = color;
      this.context.fill();
    }
  }

  fillCircle(center: Point, radius: number, color: string): void {
    this.context.beginPath();
    this.context.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.context.fillStyle = color;
    this.context.fill();
  }

  fillText(text: string, origin: Point, style: TextStyle): void {
    this.applyFont(style);
    this.context.fillStyle = style.color;
    this.context.textBaseline = "top";
    this.context.fillText(text, origin.x, origin.y);
  }

  measureTextWidth(text: string, style: TextStyle): number {
    this.applyFont(style);
    return this.context.measureText(text).width;
  }

  private tracePath(points: readonly Point[], isClosed: boolean): boolean {
    const [first, ...rest]: readonly Point[] = points;
    if (first === undefined) {
      return false;
    }
    this.context.beginPath();
    this.context.moveTo(first.x, first.y);
    for (const point of rest) {
      this.context.lineTo(point.x, point.y);
    }
    if (isClosed) {
      this.context.closePath();
    }
    return true;
  }

  private applyStroke(stroke: StrokeStyle): void {
    this.context.strokeStyle = stroke.color;
    this.context.lineWidth = stroke.width;
    this.context.lineJoin = "round";
    this.context.lineCap = "round";
  }

  private applyFont(style: TextStyle): void {
    this.context.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  }
}
