import type { AnnotationParseContext } from "../annotation/AnnotationParseContext.js";
import type { AnnotationKindName, AnnotationTypeMap } from "../annotation/AnnotationTypeMap.js";
import type { JsonObjectReader } from "../annotation/JsonObjectReader.js";
import type { Point } from "@video-player-ui/core";
import type { ViewportTransform } from "@video-player-ui/core";
import type { RenderContext } from "../overlay/RenderContext.js";

/**
 * Parsing, drawing and hit testing of one annotation kind.
 *
 * Registering a plugin is how an application adds a kind or replaces how a
 * built-in kind is drawn.
 *
 * @typeParam TKind - Kind tag the plugin handles.
 */
export interface AnnotationPlugin<TKind extends AnnotationKindName> {
  /** Kind tag the plugin handles. */
  readonly kind: TKind;

  /**
   * Build an annotation from its JSON object.
   *
   * @param reader - The annotation object, `kind` included.
   * @param context - Coordinate normalization and common field readers.
   * @returns The annotation in normalized frame coordinates.
   */
  parse(reader: JsonObjectReader, context: AnnotationParseContext): AnnotationTypeMap[TKind];

  /**
   * Draw an annotation.
   *
   * @param annotation - Annotation to draw.
   * @param context - Surface, transform, theme and resolved color.
   */
  render(annotation: AnnotationTypeMap[TKind], context: RenderContext): void;

  /**
   * Whether a view point touches an annotation; omit to make the kind ignore pointer input.
   *
   * @param annotation - Annotation to test.
   * @param point - Point in view coordinates.
   * @param transform - Mapping from normalized frame coordinates to the view.
   * @returns True when the point hits the annotation.
   */
  containsPoint?(annotation: AnnotationTypeMap[TKind], point: Point, transform: ViewportTransform): boolean;
}
