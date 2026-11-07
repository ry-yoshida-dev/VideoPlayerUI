/**
 * What a typed seek position refers to.
 */
export enum SeekTargetKind {
  /** A time id, typed as a whole number such as `123`. */
  TIME_ID = "time-id",
  /** A presentation time, typed as `m:ss`, `h:mm:ss` or with fractions such as `1:23.4`. */
  SECONDS = "seconds",
}
