import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import type { SpawnSyncReturns } from "node:child_process";

import type { SampleExpressions } from "./SampleExpressions.js";
import { SampleTrajectory } from "./SampleTrajectory.js";

const outputDirectory: URL = new URL("../public/sample/", import.meta.url);
const { x, y }: SampleExpressions = new SampleTrajectory().ffmpegExpressions();
const durationSeconds: number = SampleTrajectory.FRAME_COUNT / SampleTrajectory.FRAMES_PER_SECOND;
mkdirSync(outputDirectory, { recursive: true });

const ffmpeg: SpawnSyncReturns<Buffer> = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x1e293b:s=${SampleTrajectory.FRAME_WIDTH}x${SampleTrajectory.FRAME_HEIGHT}:r=${SampleTrajectory.FRAMES_PER_SECOND}:d=${durationSeconds}`,
    "-f",
    "lavfi",
    "-i",
    `color=c=0xf97316:s=${SampleTrajectory.BOX_SIZE}x${SampleTrajectory.BOX_SIZE}:r=${SampleTrajectory.FRAMES_PER_SECOND}:d=${durationSeconds}`,
    "-filter_complex",
    `[0]drawgrid=w=40:h=40:t=1:c=white@0.12[background];[background][1]overlay=x='${x}':y='${y}':shortest=1`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-bf",
    "2",
    "-g",
    "30",
    "-movflags",
    "+faststart",
    new URL("sample.mp4", outputDirectory).pathname,
  ],
  { stdio: "inherit" },
);
if (ffmpeg.status !== 0) {
  throw new Error(`ffmpeg exited with status ${ffmpeg.status}`);
}

process.stdout.write(`Wrote sample.mp4 to ${outputDirectory.pathname}\n`);
