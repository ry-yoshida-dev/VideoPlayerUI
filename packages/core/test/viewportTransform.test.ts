import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ContentFit, ViewportTransform } from "../src/index.js";

describe("ViewportTransform", () => {
  it("letterboxes a wide frame in a square view", () => {
    const transform: ViewportTransform = new ViewportTransform(
      { width: 1920, height: 1080 },
      { width: 400, height: 400 },
      ContentFit.CONTAIN,
    );
    assert.deepEqual(transform.contentRect, { x: 0, y: 87.5, width: 400, height: 225 });
    assert.deepEqual(transform.toView({ x: 0.5, y: 0 }), { x: 200, y: 87.5 });
    assert.deepEqual(transform.toNormalized({ x: 200, y: 87.5 }), { x: 0.5, y: 0 });
  });

  it("crops under cover and stretches under fill", () => {
    const cover: ViewportTransform = new ViewportTransform({ width: 200, height: 100 }, { width: 100, height: 100 }, ContentFit.COVER);
    assert.deepEqual(cover.contentRect, { x: -50, y: 0, width: 200, height: 100 });
    const fill: ViewportTransform = new ViewportTransform({ width: 200, height: 100 }, { width: 100, height: 100 }, ContentFit.FILL);
    assert.deepEqual(fill.rectToView({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 }), { x: 50, y: 50, width: 50, height: 50 });
  });

  it("rejects empty sizes", () => {
    assert.throws(() => new ViewportTransform({ width: 0, height: 1 }, { width: 1, height: 1 }, ContentFit.FILL), RangeError);
  });
});
