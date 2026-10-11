import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import type { Annotation } from "@video-player-ui/annotations";

import { AnalysisServerError, WebSocketFrameAnalyzer } from "../src/index.js";
import type { AnalysisRequest } from "../src/index.js";
import { FakeWebSocket } from "./support/FakeWebSocket.js";

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const requestOf = (timeId: number): AnalysisRequest => ({
  timeId,
  frame: { bytes: new ArrayBuffer(1), mimeType: "image/png", width: 1, height: 1 },
});

async function openAnalyzer(): Promise<{ readonly analyzer: WebSocketFrameAnalyzer; readonly results: Promise<readonly Annotation[]>[] }> {
  const analyzer: WebSocketFrameAnalyzer = new WebSocketFrameAnalyzer({ url: "ws://localhost:8765" });
  const results: Promise<readonly Annotation[]>[] = [analyzer.analyze(requestOf(1))];
  FakeWebSocket.instances[0]?.open();
  await settle();
  results.push(analyzer.analyze(requestOf(2)));
  await settle();
  return { analyzer, results };
}

describe("WebSocketFrameAnalyzer", () => {
  beforeEach(() => FakeWebSocket.install());

  it("rejects only the request a failure names", async () => {
    const { analyzer, results }: Awaited<ReturnType<typeof openAnalyzer>> = await openAnalyzer();
    const socket: FakeWebSocket | undefined = FakeWebSocket.instances[0];
    socket?.receive(JSON.stringify({ type: "error", requestId: 1, message: "model not loaded" }));
    await assert.rejects(
      results[0] ?? Promise.resolve(),
      (error: unknown) => error instanceof AnalysisServerError && error.message === "model not loaded",
    );
    socket?.receive(JSON.stringify({ type: "result", requestId: 2, timeId: 2, annotations: [] }));
    assert.deepEqual(await results[1], []);
    analyzer.close();
  });

  it("rejects every waiting request on a failure without a request id", async () => {
    const { analyzer, results }: Awaited<ReturnType<typeof openAnalyzer>> = await openAnalyzer();
    FakeWebSocket.instances[0]?.receive(
      JSON.stringify({ type: "error", requestId: WebSocketFrameAnalyzer.UNATTRIBUTED_REQUEST_ID, message: "bad header" }),
    );
    await assert.rejects(
      results[0] ?? Promise.resolve(),
      (error: unknown) => error instanceof AnalysisServerError && error.message === "bad header",
    );
    await assert.rejects(
      results[1] ?? Promise.resolve(),
      (error: unknown) => error instanceof AnalysisServerError && error.message === "bad header",
    );
    analyzer.close();
  });
});
