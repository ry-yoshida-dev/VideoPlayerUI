import type { Point } from "@video-player-ui/core";
import type { Rect } from "@video-player-ui/core";
import type { Size } from "@video-player-ui/core";
import type { AnnotationCommonFields } from "./AnnotationCommonFields.js";
import type { AttributeValue } from "./AttributeValue.js";
import { CoordinateSpace } from "./CoordinateSpace.js";
import type { JsonObjectReader } from "./JsonObjectReader.js";
import type { TrackId } from "./TrackId.js";

/**
 * Document-level settings and shared readers handed to annotation plugins
 * while parsing.
 */
export class AnnotationParseContext {
  /** Unit of the document's coordinates. */
  readonly coordinateSpace: CoordinateSpace;
  /** Frame size of a {@link CoordinateSpace.PIXEL} document. */
  readonly frameSize: Size | null;

  /**
   * Store the document settings.
   *
   * @param coordinateSpace - Unit of the document's coordinates.
   * @param frameSize - Frame size in pixels; required for {@link CoordinateSpace.PIXEL}.
   * @throws RangeError When a pixel document has no positive frame size.
   */
  constructor(coordinateSpace: CoordinateSpace, frameSize: Size | null) {
    if (coordinateSpace === CoordinateSpace.PIXEL && frameSize === null) {
      throw new RangeError("A pixel coordinate space requires a frameSize");
    }
    if (frameSize !== null && !(frameSize.width > 0 && frameSize.height > 0)) {
      throw new RangeError(`frameSize must be positive, given: ${frameSize.width}x${frameSize.height}`);
    }
    this.coordinateSpace = coordinateSpace;
    this.frameSize = frameSize;
  }

  /**
   * Read a point and normalize it.
   *
   * @param reader - Object with `x` and `y`.
   * @returns The point in normalized frame coordinates.
   */
  readPoint(reader: JsonObjectReader): Point {
    return this.normalizePoint({ x: reader.requireNumber("x"), y: reader.requireNumber("y") });
  }

  /**
   * Read a rectangle and normalize it.
   *
   * @param reader - Object with `x`, `y`, `width` and `height`.
   * @returns The rectangle in normalized frame coordinates.
   * @throws AnnotationFormatError When the width or height is negative.
   */
  readRect(reader: JsonObjectReader): Rect {
    const width: number = reader.requireNumber("width");
    const height: number = reader.requireNumber("height");
    if (width < 0) {
      throw reader.errorAt("width", `must not be negative, given: ${width}`);
    }
    if (height < 0) {
      throw reader.errorAt("height", `must not be negative, given: ${height}`);
    }
    const origin: Point = this.normalizePoint({
      x: reader.requireNumber("x"),
      y: reader.requireNumber("y"),
    });
    const extent: Point = this.normalizePoint({ x: width, y: height });
    return { x: origin.x, y: origin.y, width: extent.x, height: extent.y };
  }

  /**
   * Convert a point from the document's coordinate space to normalized coordinates.
   *
   * @param point - Point in the document's coordinate space.
   * @returns The point in normalized frame coordinates.
   */
  normalizePoint(point: Point): Point {
    switch (this.coordinateSpace) {
      case CoordinateSpace.NORMALIZED:
        return point;
      case CoordinateSpace.PIXEL: {
        const frameSize: Size = this.requireFrameSize();
        return { x: point.x / frameSize.width, y: point.y / frameSize.height };
      }
    }
  }

  /**
   * Read the fields every annotation kind may carry.
   *
   * @param reader - The annotation object.
   * @returns The present common fields.
   * @throws AnnotationFormatError When a common field has the wrong type or range.
   */
  readCommonFields(reader: JsonObjectReader): AnnotationCommonFields {
    const fields: { -readonly [Key in keyof AnnotationCommonFields]: AnnotationCommonFields[Key] } = {};
    const label: string | undefined = reader.optionalString("label");
    if (label !== undefined) {
      fields.label = label;
    }
    const score: number | undefined = reader.optionalNumber("score");
    if (score !== undefined) {
      if (score < 0 || score > 1) {
        throw reader.errorAt("score", `must lie in [0, 1], given: ${score}`);
      }
      fields.score = score;
    }
    if (reader.has("trackId")) {
      fields.trackId = AnnotationParseContext.readTrackId(reader);
    }
    const color: string | undefined = reader.optionalString("color");
    if (color !== undefined) {
      fields.color = color;
    }
    const attributes: JsonObjectReader | undefined = reader.optionalObject("attributes");
    if (attributes !== undefined) {
      fields.attributes = AnnotationParseContext.readAttributes(attributes);
    }
    return fields;
  }

  private requireFrameSize(): Size {
    if (this.frameSize === null) {
      throw new RangeError("A pixel coordinate space requires a frameSize");
    }
    return this.frameSize;
  }

  private static readTrackId(reader: JsonObjectReader): TrackId {
    const value: unknown = reader.raw("trackId");
    if (typeof value === "string" || (typeof value === "number" && Number.isInteger(value))) {
      return value;
    }
    throw reader.errorAt("trackId", "expected an integer or a string");
  }

  private static readAttributes(reader: JsonObjectReader): Readonly<Record<string, AttributeValue>> {
    const attributes: Record<string, AttributeValue> = {};
    for (const key of reader.keys()) {
      const value: unknown = reader.raw(key);
      if (typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) {
        attributes[key] = value;
      } else {
        throw reader.errorAt(key, "expected a string, a finite number or a boolean");
      }
    }
    return attributes;
  }
}
