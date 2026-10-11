/**
 * Formats durations as clock text such as `1:05.250` or `1:02:05.250`.
 */
export class TimeFormatter {
  /**
   * Format a duration with millisecond precision.
   *
   * @param seconds - Duration in seconds; negative values format as zero.
   * @param referenceSeconds - Longest duration shown alongside, so both use the same fields.
   * @returns The clock text.
   */
  format(seconds: number, referenceSeconds: number = seconds): string {
    const totalMilliseconds: number = Math.max(0, Math.round(seconds * 1000));
    const hours: number = Math.floor(totalMilliseconds / 3_600_000);
    const minutes: number = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
    const wholeSeconds: string = String(Math.floor((totalMilliseconds % 60_000) / 1000)).padStart(2, "0");
    const milliseconds: string = String(totalMilliseconds % 1000).padStart(3, "0");
    if (hours > 0 || referenceSeconds >= 3600) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${wholeSeconds}.${milliseconds}`;
    }
    return `${minutes}:${wholeSeconds}.${milliseconds}`;
  }
}
