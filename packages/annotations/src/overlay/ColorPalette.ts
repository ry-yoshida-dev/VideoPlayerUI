import type { Annotation } from "../annotation/AnnotationTypeMap.js";

/**
 * Deterministic assignment of colors to annotations.
 *
 * An annotation's own color wins; otherwise its track id, label or kind
 * picks a palette entry, so one object keeps its color across frames.
 */
export class ColorPalette {
  /** Default colors, distinguishable on bright and dark footage. */
  static readonly DEFAULT_COLORS: readonly string[] = [
    "#ff3b30",
    "#34c759",
    "#0a84ff",
    "#ffcc00",
    "#ff2d92",
    "#5ac8fa",
    "#ff9500",
    "#af52de",
    "#00c7be",
    "#a2845e",
  ];

  private readonly colors: readonly string[];

  /**
   * Store the palette colors.
   *
   * @param colors - CSS colors; at least one.
   * @throws RangeError When no color is given.
   */
  constructor(colors: readonly string[] = ColorPalette.DEFAULT_COLORS) {
    if (colors.length === 0) {
      throw new RangeError("A palette needs at least one color");
    }
    this.colors = colors;
  }

  /**
   * Color of an annotation.
   *
   * @param annotation - Annotation to color.
   * @returns A CSS color.
   */
  colorFor(annotation: Annotation): string {
    if (annotation.color !== undefined) {
      return annotation.color;
    }
    const key: string = annotation.trackId !== undefined ? `track:${annotation.trackId}` : `label:${annotation.label ?? annotation.kind}`;
    return this.colorForKey(key);
  }

  /**
   * Color assigned to an arbitrary key.
   *
   * @param key - Any string identifying a group.
   * @returns A CSS color.
   */
  colorForKey(key: string): string {
    const color: string | undefined = this.colors[ColorPalette.hash(key) % this.colors.length];
    if (color === undefined) {
      throw new RangeError(`No palette color for key ${key}`);
    }
    return color;
  }

  private static hash(key: string): number {
    let hash: number = 0x811c9dc5;
    for (let index = 0; index < key.length; index += 1) {
      hash ^= key.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }
}
