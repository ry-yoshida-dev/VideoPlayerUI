/**
 * How a frame is scaled into a view of another aspect ratio.
 */
export enum ContentFit {
  /** Show the whole frame, letterboxing the remaining space. */
  CONTAIN = "contain",
  /** Fill the view, cropping the frame. */
  COVER = "cover",
  /** Stretch the frame to the view, ignoring its aspect ratio. */
  FILL = "fill",
}
