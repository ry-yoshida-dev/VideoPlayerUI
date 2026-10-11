import type { AnnotationDocument } from "../annotation/AnnotationDocument.js";
import type { Annotation } from "../annotation/AnnotationTypeMap.js";
import type { Unsubscribe } from "@video-player-ui/core";
import type { AnnotationLookupOptions } from "./AnnotationLookupOptions.js";
import type { AnnotationSource } from "./AnnotationSource.js";
import { FrameAnnotationIndex } from "./FrameAnnotationIndex.js";

/**
 * Annotations fixed at construction, as loaded from a document.
 */
export class StaticAnnotationSource implements AnnotationSource {
  private readonly index: FrameAnnotationIndex;

  /**
   * Index the annotations of every frame.
   *
   * @param frames - Annotations by time id.
   * @param options - Lookup policy and hold limit.
   */
  constructor(frames: ReadonlyMap<number, readonly Annotation[]>, options: AnnotationLookupOptions = {}) {
    this.index = new FrameAnnotationIndex(options);
    for (const [timeId, annotations] of frames) {
      this.index.set(timeId, annotations);
    }
  }

  /**
   * Source over a parsed document.
   *
   * @param document - Parsed annotation document.
   * @param options - Lookup policy and hold limit.
   * @returns The source.
   */
  static fromDocument(document: AnnotationDocument, options: AnnotationLookupOptions = {}): StaticAnnotationSource {
    return new StaticAnnotationSource(document.frames, options);
  }

  annotationsAt(timeId: number): readonly Annotation[] {
    return this.index.lookup(timeId);
  }

  sourceTimeIdAt(timeId: number): number | null {
    return this.index.sourceTimeIdOf(timeId);
  }

  subscribe(): Unsubscribe {
    return () => {};
  }
}
