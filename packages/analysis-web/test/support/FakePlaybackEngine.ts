import { FrameTable } from "@video-player-ui/core";
import type { MediaInfo, PlaybackEngine, PlaybackEngineEvents } from "@video-player-ui/core";

/**
 * Engine that presents every seek target at once.
 */
export class FakePlaybackEngine implements PlaybackEngine {
  private readonly frameTable: FrameTable;
  private events: PlaybackEngineEvents | null = null;

  constructor(frameTable: FrameTable) {
    this.frameTable = frameTable;
  }

  load(events: PlaybackEngineEvents): Promise<MediaInfo> {
    this.events = events;
    return Promise.resolve({ frameSize: { width: 4, height: 3 }, frameTable: this.frameTable });
  }

  play(): Promise<void> {
    this.events?.onPlayingChange(true);
    return Promise.resolve();
  }

  pause(): void {
    this.events?.onPlayingChange(false);
  }

  async seek(presentationSeconds: number): Promise<void> {
    await Promise.resolve();
    this.events?.onFramePresented(presentationSeconds);
  }

  setPlaybackRate(): void {
    return;
  }

  setMuted(): void {
    return;
  }

  dispose(): void {
    this.events = null;
  }
}
