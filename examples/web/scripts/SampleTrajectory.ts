import type { SampleExpressions } from "./SampleExpressions.js";

/**
 * Motion of the sample's moving box. Frame index `n` shows the box at
 * `x = 20 + (7n mod 560)`, `y = 150 + round(100 sin(2πn / 90))`, so analysis
 * results can be checked against the exact position.
 */
export class SampleTrajectory {
  static readonly FRAME_WIDTH: number = 640;
  static readonly FRAME_HEIGHT: number = 360;
  static readonly FRAMES_PER_SECOND: number = 30;
  static readonly FRAME_COUNT: number = 300;
  static readonly BOX_SIZE: number = 60;

  /**
   * The same motion as ffmpeg `overlay` expressions over the frame time `t`.
   *
   * @returns The x and y expressions.
   */
  ffmpegExpressions(): SampleExpressions {
    const frame: string = `round(t*${SampleTrajectory.FRAMES_PER_SECOND})`;
    return {
      x: `20+mod(${frame}*7\\,560)`,
      y: `150+round(100*sin(2*PI*${frame}/90))`,
    };
  }
}
