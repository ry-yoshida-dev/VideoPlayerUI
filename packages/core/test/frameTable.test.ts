import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FrameTable } from "../src/index.js";

describe("FrameTable", () => {
  const variable: FrameTable = FrameTable.fromTimestamps([0, 0.04, 0.1, 0.12], 0.2);

  it("resolves a clock to the frame on screen", () => {
    assert.equal(variable.indexAt(-1), 0);
    assert.equal(variable.indexAt(0.0385), 0);
    assert.equal(variable.indexAt(0.0395), 1);
    assert.equal(variable.indexAt(0.11), 2);
    assert.equal(variable.indexAt(10), 3);
  });

  it("seeks to the middle of each display interval", () => {
    assert.equal(variable.seekTargetOf(0), 0.02);
    assert.equal(variable.seekTargetOf(2), 0.11);
    assert.ok(Math.abs(variable.seekTargetOf(3) - 0.16) < 1e-12);
  });

  it("round-trips constant frame rates", () => {
    const table: FrameTable = FrameTable.fromConstantFrameRate(300, 29.97);
    for (let index = 0; index < table.frameCount; index += 1) {
      assert.equal(table.indexAt(table.timestampOf(index)), index);
      assert.equal(table.indexAt(table.seekTargetOf(index)), index);
    }
  });

  it("rejects malformed tables", () => {
    assert.throws(() => FrameTable.fromTimestamps([], 1), RangeError);
    assert.throws(() => FrameTable.fromTimestamps([0, 0], 1), RangeError);
    assert.throws(() => FrameTable.fromTimestamps([0, 1], 1), RangeError);
    assert.throws(() => FrameTable.fromConstantFrameRate(0, 30), RangeError);
  });
});
