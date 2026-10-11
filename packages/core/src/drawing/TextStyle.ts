/**
 * How text is drawn.
 */
export interface TextStyle {
  /** CSS color. */
  readonly color: string;
  /** Font size in view units. */
  readonly fontSize: number;
  /** Font family list in CSS syntax. */
  readonly fontFamily: string;
  /** Font weight from 100 to 900. */
  readonly fontWeight: number;
}
