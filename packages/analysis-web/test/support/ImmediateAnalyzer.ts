import { AnnotationKind } from "@video-player-ui/annotations";
import type { Annotation } from "@video-player-ui/annotations";
import type { AnalysisRequest, FrameAnalyzer } from "@video-player-ui/analysis";

/**
 * Analyzer answering every request on the next turn with one box labelled by time id.
 */
export class ImmediateAnalyzer implements FrameAnalyzer {
  readonly requests: AnalysisRequest[] = [];

  async analyze(request: AnalysisRequest): Promise<readonly Annotation[]> {
    this.requests.push(request);
    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 0));
    return [{ kind: AnnotationKind.BOUNDING_BOX, box: { x: 0, y: 0, width: 1, height: 1 }, label: `frame-${request.timeId}` }];
  }

  close(): void {
    return;
  }
}
