import type { AnnotationParseContext } from "../../annotation/AnnotationParseContext.js";
import { AnnotationKind } from "../../annotation/AnnotationKind.js";
import type { BoundingBoxAnnotation } from "../../annotation/BoundingBoxAnnotation.js";
import type { JsonObjectReader } from "../../annotation/JsonObjectReader.js";
import type { Point } from "@video-player-ui/core";
import type { Rect } from "@video-player-ui/core";
import type { ViewportTransform } from "@video-player-ui/core";
import type { RenderContext } from "../../overlay/RenderContext.js";
import type { AnnotationPlugin } from "../AnnotationPlugin.js";

/**
 * Draws {@link BoundingBoxAnnotation} as an outlined box with a tag.
 */
export class BoundingBoxPlugin implements AnnotationPlugin<AnnotationKind.BOUNDING_BOX> {
  readonly kind = AnnotationKind.BOUNDING_BOX;

  parse(reader: JsonObjectReader, context: AnnotationParseContext): BoundingBoxAnnotation {
    return {
      ...context.readCommonFields(reader),
      kind: this.kind,
      box: context.readRect(reader.requireObject("box")),
    };
  }

  render(annotation: BoundingBoxAnnotation, context: RenderContext): void {
    const rect: Rect = context.transform.rectToView(annotation.box);
    if (context.isHighlighted) {
      context.surface.save();
      context.surface.multiplyOpacity(context.theme.highlightFillOpacity);
      context.surface.fillRect(rect, context.color);
      context.surface.restore();
    }
    context.surface.strokeRect(rect, {
      color: context.color,
      width: context.isHighlighted ? context.theme.highlightLineWidth : context.theme.lineWidth,
    });
    context.labelPainter.paint(annotation, { x: rect.x, y: rect.y }, context);
  }

  containsPoint(annotation: BoundingBoxAnnotation, point: Point, transform: ViewportTransform): boolean {
    const rect: Rect = transform.rectToView(annotation.box);
    return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
  }
}
