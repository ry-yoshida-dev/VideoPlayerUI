import type { DrawingSurface, Point, Rect, Size, StrokeStyle, TextStyle } from "@video-player-ui/core";

/**
 * Drawing surface that records commands as strings for assertions.
 */
export class RecordingSurface implements DrawingSurface {
  readonly size: Size;
  readonly commands: string[] = [];

  constructor(size: Size = { width: 200, height: 100 }) {
    this.size = size;
  }

  clear(): void {
    this.commands.length = 0;
    this.commands.push("clear");
  }

  save(): void {
    this.commands.push("save");
  }

  restore(): void {
    this.commands.push("restore");
  }

  multiplyOpacity(factor: number): void {
    this.commands.push(`opacity ${factor}`);
  }

  strokeRect(rect: Rect, stroke: StrokeStyle): void {
    this.commands.push(`strokeRect ${rect.x},${rect.y},${rect.width},${rect.height} ${stroke.color} ${stroke.width}`);
  }

  fillRect(rect: Rect, color: string): void {
    this.commands.push(`fillRect ${rect.x},${rect.y},${rect.width},${rect.height} ${color}`);
  }

  strokePolyline(points: readonly Point[], isClosed: boolean, stroke: StrokeStyle): void {
    this.commands.push(`strokePolyline ${points.length} ${isClosed} ${stroke.color}`);
  }

  fillPolygon(points: readonly Point[], color: string): void {
    this.commands.push(`fillPolygon ${points.length} ${color}`);
  }

  fillCircle(center: Point, radius: number, color: string): void {
    this.commands.push(`fillCircle ${center.x},${center.y} ${radius} ${color}`);
  }

  fillText(text: string, origin: Point, style: TextStyle): void {
    this.commands.push(`fillText ${text} ${origin.x},${origin.y} ${style.color}`);
  }

  measureTextWidth(text: string): number {
    return text.length * 6;
  }
}
