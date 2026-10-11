import type { SeekTarget } from "./SeekTarget.js";
import { SeekTargetKind } from "./SeekTargetKind.js";

/**
 * Reads seek positions typed into the time id field.
 */
export class SeekInputParser {
  private static readonly TIME_ID_PATTERN: RegExp = /^#?\s*(\d+)$/;
  private static readonly CLOCK_PATTERN: RegExp = /^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/;

  /**
   * Parse a typed position.
   *
   * @param text - Text as typed, such as `123`, `#123`, `1:23.4` or `1:02:03`.
   * @returns The target, or null when the text is neither a time id nor a clock time.
   */
  parse(text: string): SeekTarget | null {
    const trimmed: string = text.trim();
    const timeIdMatch: RegExpExecArray | null = SeekInputParser.TIME_ID_PATTERN.exec(trimmed);
    if (timeIdMatch?.[1] !== undefined) {
      return { kind: SeekTargetKind.TIME_ID, value: Number.parseInt(timeIdMatch[1], 10) };
    }
    const clockMatch: RegExpExecArray | null = SeekInputParser.CLOCK_PATTERN.exec(trimmed);
    if (clockMatch?.[2] === undefined || clockMatch[3] === undefined) {
      return null;
    }
    const hours: number = clockMatch[1] === undefined ? 0 : Number.parseInt(clockMatch[1], 10);
    const minutes: number = Number.parseInt(clockMatch[2], 10);
    const seconds: number = Number.parseFloat(clockMatch[3]);
    if (minutes >= 60 && clockMatch[1] !== undefined) {
      return null;
    }
    if (seconds >= 60) {
      return null;
    }
    return { kind: SeekTargetKind.SECONDS, value: hours * 3600 + minutes * 60 + seconds };
  }
}
