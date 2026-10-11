import type { Annotation } from "../annotation/AnnotationTypeMap.js";
import type { Unsubscribe } from "@video-player-ui/core";

/**
 * Supplies the annotations of each time id to an overlay layer.
 *
 * Lookups are synchronous so drawing stays in step with the frame on screen;
 * a source filled asynchronously, as from a server or an on-device model,
 * announces new data through {@link AnnotationSource.subscribe}.
 */
export interface AnnotationSource {
  /**
   * Annotations to draw on a time id.
   *
   * @param timeId - Time id of the frame on screen.
   * @returns The annotations, empty when there are none.
   */
  annotationsAt(timeId: number): readonly Annotation[];

  /**
   * Time id the annotations returned for a time id belong to, which differs
   * from it when an earlier frame's annotations are held.
   *
   * @param timeId - Time id of the frame on screen.
   * @returns The time id of the shown annotations, or null when none are shown.
   */
  sourceTimeIdAt(timeId: number): number | null;

  /**
   * Register a listener called whenever the source's contents change.
   *
   * @param listener - Called after each change.
   * @returns A function removing the listener.
   */
  subscribe(listener: () => void): Unsubscribe;
}
