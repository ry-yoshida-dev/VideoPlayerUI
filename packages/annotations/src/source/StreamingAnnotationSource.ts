import type { Annotation } from "../annotation/AnnotationTypeMap.js";
import { ListenerSet } from "@video-player-ui/core";
import type { Unsubscribe } from "@video-player-ui/core";
import type { AnnotationLookupOptions } from "./AnnotationLookupOptions.js";
import type { AnnotationSource } from "./AnnotationSource.js";
import { FrameAnnotationIndex } from "./FrameAnnotationIndex.js";

/**
 * Annotations pushed while the media plays, as from a WebSocket, a server
 * stream or an on-device model.
 *
 * It owns no transport: the application forwards whatever arrives to
 * {@link StreamingAnnotationSource.put}.
 */
export class StreamingAnnotationSource implements AnnotationSource {
  private readonly index: FrameAnnotationIndex;
  private readonly listeners: ListenerSet<void> = new ListenerSet();

  /**
   * Create an empty source.
   *
   * @param options - Lookup policy and hold limit.
   */
  constructor(options: AnnotationLookupOptions = {}) {
    this.index = new FrameAnnotationIndex(options);
  }

  /**
   * Set the annotations of one time id, replacing earlier ones.
   *
   * @param timeId - Time id the annotations belong to.
   * @param annotations - Annotations of the frame.
   */
  put(timeId: number, annotations: readonly Annotation[]): void {
    this.index.set(timeId, annotations);
    this.listeners.notify();
  }

  /**
   * Set the annotations of several time ids with one notification.
   *
   * @param frames - Annotations by time id.
   */
  putMany(frames: ReadonlyMap<number, readonly Annotation[]>): void {
    for (const [timeId, annotations] of frames) {
      this.index.set(timeId, annotations);
    }
    this.listeners.notify();
  }

  /**
   * Drop every time id before a bound, to cap memory in long streams.
   *
   * @param timeId - First time id to keep.
   */
  deleteBefore(timeId: number): void {
    this.index.deleteBefore(timeId);
    this.listeners.notify();
  }

  /**
   * Drop every annotation.
   */
  clear(): void {
    this.index.clear();
    this.listeners.notify();
  }

  annotationsAt(timeId: number): readonly Annotation[] {
    return this.index.lookup(timeId);
  }

  sourceTimeIdAt(timeId: number): number | null {
    return this.index.sourceTimeIdOf(timeId);
  }

  subscribe(listener: () => void): Unsubscribe {
    return this.listeners.add(listener);
  }
}
