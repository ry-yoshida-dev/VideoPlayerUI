import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { IndexBase, Timeline, TimelineParameters } from "../src/index.js";

interface CaseInput {
  readonly frameCount: number;
  readonly indexBase: IndexBase;
  readonly preSampledFrequency: number;
  readonly samplingFrequency: number;
  readonly startTimeId: number;
  readonly endTimeId: number | null;
}

interface CaseExpectation {
  readonly mediaLastTimeId: number;
  readonly sampledStepCount: number;
  readonly sampledTimeIds: readonly number[];
  readonly mediaIndices: readonly { readonly timeId: number; readonly mediaIndex: number }[];
  readonly rejectedTimeIds: readonly number[];
}

interface ConformanceDocument {
  readonly validCases: readonly { readonly input: CaseInput; readonly expected: CaseExpectation }[];
  readonly rejectedInputs: readonly CaseInput[];
}

const conformance: ConformanceDocument = JSON.parse(
  readFileSync(new URL("../../../spec/conformance/timeline.json", import.meta.url), "utf-8"),
) as ConformanceDocument;

function describeInput(input: CaseInput): string {
  return `N=${input.frameCount} base=${input.indexBase} P=${input.preSampledFrequency} S=${input.samplingFrequency} start=${input.startTimeId} end=${input.endTimeId}`;
}

describe("Timeline conformance with TimeSeriesIterator", () => {
  for (const { input, expected } of conformance.validCases) {
    it(describeInput(input), () => {
      const timeline: Timeline = new Timeline(input, input.frameCount);
      assert.equal(timeline.mediaLastTimeId, expected.mediaLastTimeId);
      assert.equal(timeline.sampledStepCount, expected.sampledStepCount);
      assert.deepEqual([...timeline.sampledTimeIds()], expected.sampledTimeIds);
      for (const { timeId, mediaIndex } of expected.mediaIndices) {
        assert.equal(timeline.mediaIndexOf(timeId), mediaIndex);
        assert.equal(timeline.timeIdOf(mediaIndex), timeId);
      }
      for (const timeId of expected.rejectedTimeIds) {
        assert.throws(() => timeline.mediaIndexOf(timeId), RangeError);
      }
    });
  }

  for (const input of conformance.rejectedInputs) {
    it(`rejects ${describeInput(input)}`, () => {
      assert.throws(() => new TimelineParameters(input), RangeError);
    });
  }
});

describe("Timeline stepping", () => {
  const timeline: Timeline = new Timeline(
    { indexBase: IndexBase.ONE, preSampledFrequency: 1, samplingFrequency: 3, startTimeId: 2, endTimeId: 8 },
    10,
  );

  it("moves to the next sampled id from on and off the grid", () => {
    assert.equal(timeline.nextSampledTimeId(1), 2);
    assert.equal(timeline.nextSampledTimeId(2), 5);
    assert.equal(timeline.nextSampledTimeId(3), 5);
    assert.equal(timeline.nextSampledTimeId(8), null);
  });

  it("moves to the previous sampled id from on and off the grid", () => {
    assert.equal(timeline.previousSampledTimeId(2), null);
    assert.equal(timeline.previousSampledTimeId(5), 2);
    assert.equal(timeline.previousSampledTimeId(7), 5);
    assert.equal(timeline.previousSampledTimeId(10), 8);
  });

  it("clamps into the range on the pre-sampled grid", () => {
    const coarse: Timeline = new Timeline({ preSampledFrequency: 3, endTimeId: 20 }, 10);
    assert.equal(coarse.clampToRange(-5), 1);
    assert.equal(coarse.clampToRange(6), 4);
    assert.equal(coarse.clampToRange(100), 19);
  });

  it("checks sampled ids", () => {
    assert.equal(timeline.isSampledTimeId(5), true);
    assert.equal(timeline.isSampledTimeId(6), false);
    assert.equal(timeline.isSampledTimeId(11), false);
  });
});
