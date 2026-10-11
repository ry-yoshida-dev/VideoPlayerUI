import { AnnotationKind } from "@video-player-ui/annotations";
import type { Annotation } from "@video-player-ui/annotations";

import type { AnalysisRequest, FrameAnalyzer } from "../../src/index.js";

/**
 * Analyzer whose requests the test answers by hand.
 */
export class ManualAnalyzer implements FrameAnalyzer {
  readonly requests: AnalysisRequest[] = [];
  isClosed: boolean = false;
  private readonly answers: { resolve: (annotations: readonly Annotation[]) => void; reject: (error: Error) => void }[] = [];

  analyze(request: AnalysisRequest): Promise<readonly Annotation[]> {
    this.requests.push(request);
    return new Promise((resolve, reject) => {
      this.answers.push({ resolve, reject });
    });
  }

  close(): void {
    this.isClosed = true;
  }

  succeed(): void {
    const timeId: number = this.requests[this.answers.length - 1]?.timeId ?? -1;
    this.answers
      .shift()
      ?.resolve([{ kind: AnnotationKind.BOUNDING_BOX, box: { x: 0, y: 0, width: 1, height: 1 }, label: `frame-${timeId}` }]);
  }

  fail(message: string): void {
    this.answers.shift()?.reject(new Error(message));
  }
}
