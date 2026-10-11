import type { Annotation } from "../annotation/AnnotationTypeMap.js";
import type { Point } from "@video-player-ui/core";
import type { LabelTheme } from "./LabelTheme.js";
import type { RenderContext } from "./RenderContext.js";
import type { TextStyle } from "@video-player-ui/core";

/**
 * Draws the colored tag naming an annotation, shared by every plugin so tags
 * look the same across kinds.
 */
export class LabelPainter {
  /**
   * Text of an annotation's tag, such as `person #4 0.93`.
   *
   * @param annotation - Annotation to describe.
   * @param theme - Which parts the tag shows.
   * @returns The text, or an empty string when there is nothing to show.
   */
  textOf(annotation: Annotation, theme: LabelTheme): string {
    const parts: string[] = [];
    if (annotation.label !== undefined) {
      parts.push(annotation.label);
    }
    if (theme.isTrackIdVisible && annotation.trackId !== undefined) {
      parts.push(`#${annotation.trackId}`);
    }
    if (theme.isScoreVisible && annotation.score !== undefined) {
      parts.push(annotation.score.toFixed(2));
    }
    return parts.join(" ");
  }

  /**
   * Draw the tag just above an anchor, or just below it when there is no room above.
   *
   * @param annotation - Annotation the tag names.
   * @param anchor - Top-left corner of the annotation in view coordinates.
   * @param context - Drawing context of the annotation.
   */
  paint(annotation: Annotation, anchor: Point, context: RenderContext): void {
    const theme: LabelTheme = context.theme.label;
    if (!theme.isVisible) {
      return;
    }
    const text: string = this.textOf(annotation, theme);
    if (text.length === 0) {
      return;
    }
    const style: TextStyle = {
      color: theme.textColor,
      fontSize: theme.fontSize,
      fontFamily: theme.fontFamily,
      fontWeight: theme.fontWeight,
    };
    const width: number = context.surface.measureTextWidth(text, style) + theme.padding * 2;
    const height: number = theme.fontSize + theme.padding * 2;
    const maximumX: number = Math.max(0, context.surface.size.width - width);
    const x: number = Math.min(Math.max(anchor.x, 0), maximumX);
    const y: number = anchor.y - height >= 0 ? anchor.y - height : Math.max(anchor.y, 0);
    context.surface.fillRect({ x, y, width, height }, context.color);
    context.surface.fillText(text, { x: x + theme.padding, y: y + theme.padding }, style);
  }
}
