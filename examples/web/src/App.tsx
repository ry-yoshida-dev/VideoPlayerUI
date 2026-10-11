import { useMemo, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { WebSocketFrameAnalyzer } from "@video-player-ui/analysis";
import { LiveAnalysis } from "@video-player-ui/analysis-web";
import type { OverlayHit } from "@video-player-ui/annotations";
import { IndexBase } from "@video-player-ui/core";
import type { PlayerController, TimelineParametersInit } from "@video-player-ui/core";
import { VideoPlayer } from "@video-player-ui/web";
import type { VideoSource } from "@video-player-ui/web";

import { OpenFileGlyph } from "./OpenFileGlyph.js";

const SAMPLE_VIDEO: string = "/sample/sample.mp4";
const TIMELINE: TimelineParametersInit = { indexBase: IndexBase.ONE };
const QUERY: URLSearchParams = new URLSearchParams(window.location.search);
const ANALYSIS_URL: string = QUERY.get("analysis") ?? "ws://localhost:8765";
const LOOKAHEAD_SECONDS: number = Number(QUERY.get("lookahead") ?? "1");

declare global {
  interface Window {
    videoPlayerController?: PlayerController | null;
  }
}

/**
 * Demo page: plays the generated sample or a video picked from disk, and
 * sends the frames on screen to the analysis server for live overlays.
 *
 * @returns The page.
 */
export function App(): ReactElement {
  const [source, setSource] = useState<VideoSource>(SAMPLE_VIDEO);
  const [selected, setSelected] = useState<OverlayHit | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLiveAnalysisMounted, setIsLiveAnalysisMounted] = useState<boolean>(true);
  const analyzer: WebSocketFrameAnalyzer = useMemo((): WebSocketFrameAnalyzer => new WebSocketFrameAnalyzer({ url: ANALYSIS_URL }), []);

  const onVideoPicked: (event: ChangeEvent<HTMLInputElement>) => void = (event: ChangeEvent<HTMLInputElement>): void => {
    const file: File | undefined = event.target.files?.[0];
    if (file !== undefined) {
      setSource(file);
      setSelected(null);
    }
  };

  return (
    <main className="page">
      <style>{pageStyles}</style>
      <VideoPlayer
        ref={(controller: PlayerController | null) => {
          window.videoPlayerController = controller;
        }}
        source={source}
        timeline={TIMELINE}
        framesPerSecond={30}
        onError={(error: Error) => setErrorMessage(error.message)}
        style={{ width: "100%", borderRadius: 12 }}
      >
        {isLiveAnalysisMounted && <LiveAnalysis analyzer={analyzer} lookaheadSeconds={LOOKAHEAD_SECONDS} onAnnotationClick={setSelected} />}
      </VideoPlayer>
      <div className="toolbar">
        <label className="picker" title="Open video">
          <OpenFileGlyph />
          <input type="file" accept="video/*" aria-label="Open video" onChange={onVideoPicked} />
        </label>
        <label className="switch">
          <input
            type="checkbox"
            checked={isLiveAnalysisMounted}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setIsLiveAnalysisMounted(event.target.checked)}
          />
          {"<LiveAnalysis>"}
        </label>
        <span className="hint">{ANALYSIS_URL}</span>
      </div>
      {errorMessage !== null && <p className="error">{errorMessage}</p>}
      {selected !== null && <pre className="selection">{JSON.stringify(selected, null, 2)}</pre>}
    </main>
  );
}

const pageStyles: string = `
body { margin: 0; background: #0b0f17; color: #e5e7eb; font-family: system-ui, sans-serif; }
.page { max-width: 960px; margin: 24px auto; padding: 0 16px; display: grid; gap: 12px; }
.toolbar { display: flex; gap: 10px; align-items: center; }
.picker { position: relative; width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center;
  color: #e5e7eb; background: transparent; border: 1px solid rgba(255, 255, 255, 0.18); cursor: pointer; }
.picker:hover { background: rgba(255, 255, 255, 0.08); }
.picker input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.switch { display: flex; gap: 6px; align-items: center; font: 12px ui-monospace, monospace; cursor: pointer; }
.hint { font: 12px ui-monospace, monospace; opacity: 0.5; }
.error { color: #fca5a5; margin: 0; }
.selection { margin: 0; padding: 12px; border-radius: 10px; background: #111827; font-size: 12px; overflow: auto; }
`;
