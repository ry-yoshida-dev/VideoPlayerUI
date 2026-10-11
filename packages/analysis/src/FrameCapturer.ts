import type { AnalysisRequest } from "./AnalysisRequest.js";

/**
 * Encodes one frame for analysis; called once, at the moment the frame is sent.
 */
export type FrameCapturer = () => Promise<AnalysisRequest>;
