import type { AnnotationParseContext } from "../../annotation/AnnotationParseContext.js";
import { AnnotationKind } from "../../annotation/AnnotationKind.js";
import type { JsonObjectReader } from "../../annotation/JsonObjectReader.js";
import type { Keypoint } from "../../annotation/Keypoint.js";
import type { KeypointEdge } from "../../annotation/KeypointEdge.js";
import type { KeypointsAnnotation } from "../../annotation/KeypointsAnnotation.js";
import type { Point } from "@video-player-ui/core";
import type { ViewportTransform } from "@video-player-ui/core";
import type { RenderContext } from "../../overlay/RenderContext.js";
import type { AnnotationPlugin } from "../AnnotationPlugin.js";

/**
 * Draws {@link KeypointsAnnotation} as dots joined by skeleton edges.
 */
export class KeypointsPlugin implements AnnotationPlugin<AnnotationKind.KEYPOINTS> {
  readonly kind = AnnotationKind.KEYPOINTS;
  /** Distance in view units from a keypoint within which it counts as hit. */
  static readonly HIT_RADIUS: number = 8;

  parse(reader: JsonObjectReader, context: AnnotationParseContext): KeypointsAnnotation {
    const points: readonly Keypoint[] = reader.requireObjectArray("points").map((pointReader: JsonObjectReader) => {
      const position: Point = context.readPoint(pointReader);
      const score: number | undefined = pointReader.optionalNumber("score");
      if (score === undefined) {
        return position;
      }
      if (score < 0 || score > 1) {
        throw pointReader.errorAt("score", `must lie in [0, 1], given: ${score}`);
      }
      return { ...position, score };
    });
    const edges: KeypointEdge[] = [];
    if (reader.has("edges")) {
      reader.requireArray("edges").forEach((edge: unknown, index: number) => {
        edges.push(KeypointsPlugin.readEdge(reader, edge, index, points.length));
      });
    }
    return { ...context.readCommonFields(reader), kind: this.kind, points, edges };
  }

  render(annotation: KeypointsAnnotation, context: RenderContext): void {
    const threshold: number = context.theme.keypointScoreThreshold;
    const viewPoints: readonly (Point | null)[] = annotation.points.map((keypoint: Keypoint) =>
      (keypoint.score ?? 1) >= threshold ? context.transform.toView(keypoint) : null,
    );
    const lineWidth: number = context.isHighlighted ? context.theme.highlightLineWidth : context.theme.lineWidth;
    for (const edge of annotation.edges) {
      const start: Point | null | undefined = viewPoints[edge.from];
      const end: Point | null | undefined = viewPoints[edge.to];
      if (start && end) {
        context.surface.strokePolyline([start, end], false, { color: context.color, width: lineWidth });
      }
    }
    const visiblePoints: Point[] = [];
    for (const point of viewPoints) {
      if (point) {
        visiblePoints.push(point);
        context.surface.fillCircle(point, context.theme.keypointRadius, context.color);
      }
    }
    if (visiblePoints.length > 0) {
      const anchor: Point = {
        x: Math.min(...visiblePoints.map((point: Point) => point.x)),
        y: Math.min(...visiblePoints.map((point: Point) => point.y)),
      };
      context.labelPainter.paint(annotation, anchor, context);
    }
  }

  containsPoint(annotation: KeypointsAnnotation, point: Point, transform: ViewportTransform): boolean {
    return annotation.points.some((keypoint: Keypoint) => {
      const viewPoint: Point = transform.toView(keypoint);
      return Math.hypot(viewPoint.x - point.x, viewPoint.y - point.y) <= KeypointsPlugin.HIT_RADIUS;
    });
  }

  private static readEdge(reader: JsonObjectReader, edge: unknown, index: number, pointCount: number): KeypointEdge {
    const path: string = `edges[${index}]`;
    if (!Array.isArray(edge) || edge.length !== 2) {
      throw reader.errorAt(path, "expected a pair of point indices");
    }
    const pair: readonly unknown[] = edge;
    const from: unknown = pair[0];
    const to: unknown = pair[1];
    if (!KeypointsPlugin.isPointIndex(from, pointCount) || !KeypointsPlugin.isPointIndex(to, pointCount)) {
      throw reader.errorAt(path, `point indices must be integers between 0 and ${pointCount - 1}`);
    }
    return { from, to };
  }

  private static isPointIndex(value: unknown, pointCount: number): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < pointCount;
  }
}
