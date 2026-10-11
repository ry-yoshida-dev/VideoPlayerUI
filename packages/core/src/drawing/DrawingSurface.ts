import type { Point } from "../geometry/Point.js";
import type { Rect } from "../geometry/Rect.js";
import type { Size } from "../geometry/Size.js";
import type { StrokeStyle } from "./StrokeStyle.js";
import type { TextStyle } from "./TextStyle.js";

/**
 * Platform-neutral drawing commands in view coordinates.
 *
 * Each platform implements it once (Canvas 2D on the web, Skia on native),
 * so every annotation plugin draws on every platform.
 */
export interface DrawingSurface {
  /** Size of the surface in view units. */
  readonly size: Size;
  /** Erase the whole surface. */
  clear(): void;
  /** Push the current opacity onto a stack. */
  save(): void;
  /** Pop the opacity pushed by the matching {@link DrawingSurface.save}. */
  restore(): void;
  /** Multiply the opacity of later drawing by a factor in `[0, 1]`. */
  multiplyOpacity(factor: number): void;
  /** Outline a rectangle. */
  strokeRect(rect: Rect, stroke: StrokeStyle): void;
  /** Fill a rectangle. */
  fillRect(rect: Rect, color: string): void;
  /** Draw connected line segments, joining the last point to the first when closed. */
  strokePolyline(points: readonly Point[], isClosed: boolean, stroke: StrokeStyle): void;
  /** Fill the polygon the points enclose. */
  fillPolygon(points: readonly Point[], color: string): void;
  /** Fill a circle. */
  fillCircle(center: Point, radius: number, color: string): void;
  /** Draw a single line of text with its top-left corner at the origin. */
  fillText(text: string, origin: Point, style: TextStyle): void;
  /** Width of a single line of text in view units. */
  measureTextWidth(text: string, style: TextStyle): number;
}
