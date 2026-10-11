import { ContentFit } from "./ContentFit.js";
import type { Point } from "./Point.js";
import type { Rect } from "./Rect.js";
import type { Size } from "./Size.js";

/**
 * Mapping between normalized frame coordinates and view coordinates.
 *
 * Normalized coordinates lie in `[0, 1]` across the frame; view coordinates
 * are the layout units of the view the frame is drawn in.
 */
export class ViewportTransform {
  /** Area of the view the frame occupies; may extend past the view under {@link ContentFit.COVER}. */
  readonly contentRect: Rect;
  /** Size of the view. */
  readonly viewSize: Size;

  /**
   * Compute where a frame lands in a view.
   *
   * @param frameSize - Frame size in pixels.
   * @param viewSize - View size in layout units.
   * @param fit - How the frame is scaled into the view.
   * @throws RangeError When a size is not positive.
   */
  constructor(frameSize: Size, viewSize: Size, fit: ContentFit) {
    ViewportTransform.requirePositive("frameSize", frameSize);
    ViewportTransform.requirePositive("viewSize", viewSize);
    this.viewSize = viewSize;
    this.contentRect = ViewportTransform.fitContent(frameSize, viewSize, fit);
  }

  /**
   * Map a normalized frame point into the view.
   *
   * @param point - Point in normalized frame coordinates.
   * @returns The point in view coordinates.
   */
  toView(point: Point): Point {
    return {
      x: this.contentRect.x + point.x * this.contentRect.width,
      y: this.contentRect.y + point.y * this.contentRect.height,
    };
  }

  /**
   * Map a normalized frame rectangle into the view.
   *
   * @param rect - Rectangle in normalized frame coordinates.
   * @returns The rectangle in view coordinates.
   */
  rectToView(rect: Rect): Rect {
    return {
      x: this.contentRect.x + rect.x * this.contentRect.width,
      y: this.contentRect.y + rect.y * this.contentRect.height,
      width: rect.width * this.contentRect.width,
      height: rect.height * this.contentRect.height,
    };
  }

  /**
   * Map a view point back into normalized frame coordinates, as for pointer input.
   *
   * @param point - Point in view coordinates.
   * @returns The point in normalized frame coordinates; outside `[0, 1]` off the frame.
   */
  toNormalized(point: Point): Point {
    return {
      x: (point.x - this.contentRect.x) / this.contentRect.width,
      y: (point.y - this.contentRect.y) / this.contentRect.height,
    };
  }

  private static fitContent(frameSize: Size, viewSize: Size, fit: ContentFit): Rect {
    const scaleX: number = viewSize.width / frameSize.width;
    const scaleY: number = viewSize.height / frameSize.height;
    let width: number;
    let height: number;
    switch (fit) {
      case ContentFit.FILL:
        return { x: 0, y: 0, width: viewSize.width, height: viewSize.height };
      case ContentFit.CONTAIN: {
        const scale: number = Math.min(scaleX, scaleY);
        width = frameSize.width * scale;
        height = frameSize.height * scale;
        break;
      }
      case ContentFit.COVER: {
        const scale: number = Math.max(scaleX, scaleY);
        width = frameSize.width * scale;
        height = frameSize.height * scale;
        break;
      }
    }
    return {
      x: (viewSize.width - width) / 2,
      y: (viewSize.height - height) / 2,
      width,
      height,
    };
  }

  private static requirePositive(name: string, size: Size): void {
    if (!(size.width > 0 && size.height > 0)) {
      throw new RangeError(`${name} must have a positive width and height, given: ${size.width}x${size.height}`);
    }
  }
}
