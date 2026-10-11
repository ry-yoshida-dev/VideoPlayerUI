import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AnnotationDocumentParser,
  AnnotationFormatError,
  AnnotationKind,
  AnnotationLookupPolicy,
  AnnotationPluginRegistry,
  OverlayComposer,
  StaticAnnotationSource,
  StreamingAnnotationSource,
} from "../src/index.js";
import { ContentFit, ViewportTransform } from "@video-player-ui/core";
import type {
  Annotation,
  AnnotationBase,
  AnnotationDocument,
  AnnotationParseContext,
  AnnotationPlugin,
  JsonObjectReader,
  OverlayHit,
  RenderContext,
} from "../src/index.js";
import { RecordingSurface } from "./support/RecordingSurface.js";

interface CrosshairAnnotation extends AnnotationBase<"crosshair"> {
  readonly x: number;
  readonly y: number;
}

declare module "../src/annotation/AnnotationTypeMap.js" {
  interface AnnotationTypeMap {
    crosshair: CrosshairAnnotation;
  }
}

class CrosshairPlugin implements AnnotationPlugin<"crosshair"> {
  readonly kind = "crosshair";

  parse(reader: JsonObjectReader, context: AnnotationParseContext): CrosshairAnnotation {
    return { ...context.readCommonFields(reader), kind: this.kind, ...context.readPoint(reader) };
  }

  render(annotation: CrosshairAnnotation, context: RenderContext): void {
    context.surface.fillCircle(context.transform.toView(annotation), 1, context.color);
  }
}

const parser: AnnotationDocumentParser = new AnnotationDocumentParser();

function firstAnnotation(document: AnnotationDocument, timeId: number): Annotation {
  const annotation: Annotation | undefined = document.frames.get(timeId)?.[0];
  assert.ok(annotation !== undefined);
  return annotation;
}

describe("AnnotationDocumentParser", () => {
  it("parses every built-in kind", () => {
    const document: AnnotationDocument = parser.parse({
      formatVersion: 1,
      frames: [
        {
          timeId: 1,
          annotations: [
            { kind: "bounding-box", box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }, label: "person", score: 0.9, trackId: 3 },
            {
              kind: "polygon",
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
              ],
            },
            {
              kind: "keypoints",
              points: [
                { x: 0.5, y: 0.5, score: 0.2 },
                { x: 0.6, y: 0.6 },
              ],
              edges: [[0, 1]],
            },
          ],
        },
      ],
    });
    const annotations: readonly Annotation[] = document.frames.get(1) ?? [];
    assert.deepEqual(
      annotations.map((annotation: Annotation) => annotation.kind),
      [AnnotationKind.BOUNDING_BOX, AnnotationKind.POLYGON, AnnotationKind.KEYPOINTS],
    );
    assert.deepEqual(annotations[0], {
      kind: "bounding-box",
      box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
      label: "person",
      score: 0.9,
      trackId: 3,
    });
    assert.deepEqual(annotations[1], {
      kind: "polygon",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
      isClosed: true,
    });
  });

  it("normalizes pixel coordinates", () => {
    const document: AnnotationDocument = parser.parse({
      formatVersion: 1,
      coordinateSpace: "pixel",
      frameSize: { width: 200, height: 100 },
      frames: [{ timeId: 5, annotations: [{ kind: "bounding-box", box: { x: 20, y: 10, width: 100, height: 50 } }] }],
    });
    assert.deepEqual(firstAnnotation(document, 5), {
      kind: "bounding-box",
      box: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
    });
  });

  it("reports the path of invalid values", () => {
    const cases: readonly { readonly document: unknown; readonly path: string }[] = [
      { document: { formatVersion: 2, frames: [] }, path: "$.formatVersion" },
      { document: { formatVersion: 1, coordinateSpace: "pixel", frames: [] }, path: "$.frameSize" },
      {
        document: { formatVersion: 1, frames: [{ timeId: 1, annotations: [{ kind: "bounding-box" }] }] },
        path: "$.frames[0].annotations[0].box",
      },
      {
        document: { formatVersion: 1, frames: [{ timeId: 1, annotations: [{ kind: "unknown" }] }] },
        path: "$.frames[0].annotations[0].kind",
      },
      {
        document: {
          formatVersion: 1,
          frames: [{ timeId: 1, annotations: [{ kind: "bounding-box", score: 2, box: { x: 0, y: 0, width: 1, height: 1 } }] }],
        },
        path: "$.frames[0].annotations[0].score",
      },
      {
        document: {
          formatVersion: 1,
          frames: [
            { timeId: 1, annotations: [] },
            { timeId: 1, annotations: [] },
          ],
        },
        path: "$.frames[1].timeId",
      },
      {
        document: {
          formatVersion: 1,
          frames: [{ timeId: 1, annotations: [{ kind: "keypoints", points: [{ x: 0, y: 0 }], edges: [[0, 1]] }] }],
        },
        path: "$.frames[0].annotations[0].edges[0]",
      },
    ];
    for (const { document, path } of cases) {
      assert.throws(
        () => parser.parse(document),
        (error: unknown) => error instanceof AnnotationFormatError && error.path === path,
        path,
      );
    }
  });

  it("parses, draws and colors custom kinds through registered plugins", () => {
    const registry: AnnotationPluginRegistry = AnnotationPluginRegistry.withBuiltins().register(new CrosshairPlugin());
    const document: AnnotationDocument = new AnnotationDocumentParser(registry).parse({
      formatVersion: 1,
      frames: [{ timeId: 1, annotations: [{ kind: "crosshair", x: 0.5, y: 0.5, color: "#123456" }] }],
    });
    const surface: RecordingSurface = new RecordingSurface();
    new OverlayComposer(registry).render({
      surface,
      transform: new ViewportTransform({ width: 200, height: 100 }, surface.size, ContentFit.FILL),
      timeId: 1,
      layers: [{ id: "custom", source: StaticAnnotationSource.fromDocument(document) }],
    });
    assert.deepEqual(surface.commands, ["clear", "save", "opacity 1", "fillCircle 100,50 1 #123456", "restore"]);
  });
});

describe("Annotation sources", () => {
  const box: Annotation = { kind: AnnotationKind.BOUNDING_BOX, box: { x: 0, y: 0, width: 1, height: 1 } };
  const frames: ReadonlyMap<number, readonly Annotation[]> = new Map([
    [10, [box]],
    [20, []],
  ]);

  it("holds the previous annotated frame within the limit", () => {
    const source: StaticAnnotationSource = new StaticAnnotationSource(frames, { maxHoldTimeIds: 4 });
    assert.equal(source.sourceTimeIdAt(9), null);
    assert.equal(source.sourceTimeIdAt(10), 10);
    assert.equal(source.sourceTimeIdAt(13), 10);
    assert.deepEqual(source.annotationsAt(9), []);
    assert.deepEqual(source.annotationsAt(10), [box]);
    assert.deepEqual(source.annotationsAt(14), [box]);
    assert.deepEqual(source.annotationsAt(15), []);
    assert.deepEqual(source.annotationsAt(21), []);
  });

  it("shows only exact frames under the exact policy", () => {
    const source: StaticAnnotationSource = new StaticAnnotationSource(frames, { policy: AnnotationLookupPolicy.EXACT });
    assert.deepEqual(source.annotationsAt(11), []);
  });

  it("notifies on streamed annotations and trims old frames", () => {
    const source: StreamingAnnotationSource = new StreamingAnnotationSource();
    let notificationCount: number = 0;
    source.subscribe(() => {
      notificationCount += 1;
    });
    source.put(30, [box]);
    source.put(10, [box]);
    assert.deepEqual(source.annotationsAt(35), [box]);
    source.deleteBefore(20);
    assert.deepEqual(source.annotationsAt(15), []);
    assert.equal(notificationCount, 3);
  });
});

describe("OverlayComposer", () => {
  const surface: RecordingSurface = new RecordingSurface({ width: 200, height: 100 });
  const transform: ViewportTransform = new ViewportTransform({ width: 200, height: 100 }, surface.size, ContentFit.CONTAIN);
  const person: Annotation = {
    kind: AnnotationKind.BOUNDING_BOX,
    box: { x: 0.1, y: 0.5, width: 0.2, height: 0.2 },
    label: "person",
    score: 0.5,
    color: "red",
  };
  const source: StaticAnnotationSource = new StaticAnnotationSource(new Map([[1, [person]]]));
  const composer: OverlayComposer = new OverlayComposer();

  it("draws boxes with tags and highlights", () => {
    composer.render({
      surface,
      transform,
      timeId: 1,
      layers: [{ id: "predictions", source, opacity: 0.5 }],
      isHighlighted: (hit: OverlayHit) => hit.annotation === person,
    });
    assert.deepEqual(surface.commands, [
      "clear",
      "save",
      "opacity 0.5",
      "save",
      "opacity 0.35",
      "fillRect 20,50,40,20 red",
      "restore",
      "strokeRect 20,50,40,20 red 4",
      "fillRect 20,32,72,18 red",
      "fillText person 0.50 23,35 #ffffff",
      "restore",
    ]);
  });

  it("fades annotations held from an earlier frame", () => {
    composer.render({ surface, transform, timeId: 3, layers: [{ id: "held", source }] });
    assert.deepEqual(surface.commands.slice(0, 3), ["clear", "save", "opacity 0.4"]);
  });

  it("skips hidden and filtered layers", () => {
    composer.render({
      surface,
      transform,
      timeId: 1,
      layers: [
        { id: "hidden", source, isVisible: false },
        { id: "filtered", source, filter: (annotation: Annotation) => (annotation.score ?? 0) > 0.8 },
      ],
    });
    assert.deepEqual(surface.commands, ["clear", "save", "opacity 1", "restore"]);
  });

  it("hit tests topmost first", () => {
    const hits: readonly OverlayHit[] = composer.hitTest(
      transform,
      1,
      [
        { id: "bottom", source },
        { id: "top", source },
      ],
      { x: 30, y: 60 },
    );
    assert.deepEqual(
      hits.map((hit: OverlayHit) => hit.layerId),
      ["top", "bottom"],
    );
    assert.deepEqual(composer.hitTest(transform, 1, [{ id: "bottom", source }], { x: 100, y: 10 }), []);
  });
});
