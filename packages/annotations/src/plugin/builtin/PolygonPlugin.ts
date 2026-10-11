import type { AnnotationParseContext } from "../../annotation/AnnotationParseContext.js";
import { AnnotationKind } from "../../annotation/AnnotationKind.js";
import type { JsonObjectReader } from "../../annotation/JsonObjectReader.js";
import type { PolygonAnnotation } from "../../annotation/PolygonAnnotation.js";
import type { Point } from "@video-player-ui/core";
import type { ViewportTransform } from "@video-player-ui/core";
import type { RenderContext } from "../../overlay/RenderContext.js";
import type { AnnotationPlugin } from "../AnnotationPlugin.js";

/**
 * Draws {@link PolygonAnnotation} as a filled outline, or a polyline when open.
 */
export class PolygonPlugin implements AnnotationPlugin<AnnotationKind.POLYGON> {
  readonly kind = AnnotationKind.POLYGON;
  /** Distance in view units within which an open polyline counts as hit. */
  static readonly POLYLINE_HIT_DISTANCE: number = 6;

  parse(reader: JsonObjectReader, context: AnnotationParseContext): PolygonAnnotation {
    const pointReaders: readonly JsonObjectReader[] = reader.requireObjectArray("points");
    if (pointReaders.length < 3) {
      throw reader.errorAt("points", `needs at least 3 points, given: ${pointReaders.length}`);
    }
    return {
      ...context.readCommonFields(reader),
      kind: this.kind,
      points: pointReaders.map((pointReader: JsonObjectReader) => context.readPoint(pointReader)),
      isClosed: reader.optionalBoolean("isClosed") ?? true,
    };
  }

  render(annotation: PolygonAnnotation, context: RenderContext): void {
    const points: readonly Point[] = annotation.points.map((point: Point) => context.transform.toView(point));
    if (annotation.isClosed) {
      context.surface.save();
      context.surface.multiplyOpacity(context.isHighlighted ? context.theme.highlightFillOpacity : context.theme.fillOpacity);
      context.surface.fillPolygon(points, context.color);
      context.surface.restore();
    }
    context.surface.strokePolyline(points, annotation.isClosed, {
      color: context.color,
      width: context.isHighlighted ? context.theme.highlightLineWidth : context.theme.lineWidth,
    });
    const anchor: Point = points.reduce((top: Point, point: Point) => (point.y < top.y ? point : top));
    context.labelPainter.paint(annotation, anchor, context);
  }

  containsPoint(annotation: PolygonAnnotation, point: Point, transform: ViewportTransform): boolean {
    const points: readonly Point[] = annotation.points.map((vertex: Point) => transform.toView(vertex));
    return annotation.isClosed ? PolygonPlugin.isInside(points, point) : PolygonPlugin.isNearPolyline(points, point);
  }

  private static isInside(points: readonly Point[], point: Point): boolean {
    let isInside: boolean = false;
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
      const current: Point | undefined = points[index];
      const before: Point | undefined = points[previous];
      if (current === undefined || before === undefined) {
        continue;
      }
      const isCrossing: boolean =
        current.y > point.y !== before.y > point.y &&
        point.x < ((before.x - current.x) * (point.y - current.y)) / (before.y - current.y) + current.x;
      if (isCrossing) {
        isInside = !isInside;
      }
    }
    return isInside;
  }

  private static isNearPolyline(points: readonly Point[], point: Point): boolean {
    for (let index = 1; index < points.length; index += 1) {
      const start: Point | undefined = points[index - 1];
      const end: Point | undefined = points[index];
      if (
        start !== undefined &&
        end !== undefined &&
        PolygonPlugin.distanceToSegment(point, start, end) <= PolygonPlugin.POLYLINE_HIT_DISTANCE
      ) {
        return true;
      }
    }
    return false;
  }

  private static distanceToSegment(point: Point, start: Point, end: Point): number {
    const deltaX: number = end.x - start.x;
    const deltaY: number = end.y - start.y;
    const lengthSquared: number = deltaX * deltaX + deltaY * deltaY;
    const ratio: number =
      lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared));
    return Math.hypot(point.x - (start.x + ratio * deltaX), point.y - (start.y + ratio * deltaY));
  }
}
