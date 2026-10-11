import type { AnalysisFailure } from "./AnalysisFailure.js";
import type { AnalysisResult } from "./AnalysisResult.js";

/**
 * Any answer of an analysis server.
 */
export type AnalysisResponse = AnalysisResult | AnalysisFailure;
