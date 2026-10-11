import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AnnotationFormatError } from "@video-player-ui/annotations";

import { RequestEncoder, ResponseDecoder, ResponseKind } from "../src/index.js";
import type { AnalysisResponse } from "../src/index.js";

describe("Analysis protocol", () => {
  it("encodes a length-prefixed JSON header followed by the image", () => {
    const image: Uint8Array<ArrayBuffer> = new Uint8Array([1, 2, 3]);
    const message: ArrayBuffer = new RequestEncoder().encode(17, {
      timeId: 123,
      frame: { bytes: image.buffer, mimeType: "image/png", width: 640, height: 360 },
    });
    const headerLength: number = new DataView(message).getUint32(0, false);
    const header: unknown = JSON.parse(new TextDecoder().decode(new Uint8Array(message, 4, headerLength)));
    assert.deepEqual(header, { type: "analyze", requestId: 17, timeId: 123, mimeType: "image/png", width: 640, height: 360 });
    assert.deepEqual([...new Uint8Array(message, 4 + headerLength)], [1, 2, 3]);
  });

  it("decodes results in pixel coordinates and failures", () => {
    const decoder: ResponseDecoder = new ResponseDecoder();
    const result: AnalysisResponse = decoder.decode(
      JSON.stringify({
        type: "result",
        requestId: 17,
        timeId: 123,
        coordinateSpace: "pixel",
        frameSize: { width: 200, height: 100 },
        annotations: [{ kind: "bounding-box", box: { x: 20, y: 10, width: 100, height: 50 }, label: "car" }],
      }),
    );
    assert.deepEqual(result, {
      kind: ResponseKind.RESULT,
      requestId: 17,
      timeId: 123,
      annotations: [{ kind: "bounding-box", box: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 }, label: "car" }],
    });
    assert.deepEqual(decoder.decode(JSON.stringify({ type: "error", requestId: 4, message: "boom" })), {
      kind: ResponseKind.ERROR,
      requestId: 4,
      message: "boom",
    });
    assert.throws(() => decoder.decode(JSON.stringify({ type: "hello", requestId: 1 })), AnnotationFormatError);
  });
});
