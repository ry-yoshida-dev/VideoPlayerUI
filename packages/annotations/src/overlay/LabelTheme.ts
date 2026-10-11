/**
 * Appearance of the tag drawn next to an annotation.
 */
export interface LabelTheme {
  /** Whether tags are drawn. */
  readonly isVisible: boolean;
  /** Whether the score follows the label. */
  readonly isScoreVisible: boolean;
  /** Whether the track id follows the label. */
  readonly isTrackIdVisible: boolean;
  /** Font size in view units. */
  readonly fontSize: number;
  /** Font family list in CSS syntax. */
  readonly fontFamily: string;
  /** Font weight from 100 to 900. */
  readonly fontWeight: number;
  /** CSS color of the text. */
  readonly textColor: string;
  /** Space between the text and the tag's edge, in view units. */
  readonly padding: number;
}
