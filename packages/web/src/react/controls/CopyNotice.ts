import type { CopyStatus } from "./CopyStatus.js";

/**
 * One showing of the copy confirmation; a new serial restarts it.
 */
export interface CopyNotice {
  readonly status: CopyStatus;
  readonly serial: number;
}
