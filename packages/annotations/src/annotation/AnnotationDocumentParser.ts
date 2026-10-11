import type { Size } from "@video-player-ui/core";
import { AnnotationPluginRegistry } from "../plugin/AnnotationPluginRegistry.js";
import type { AnnotationDocument } from "./AnnotationDocument.js";
import { AnnotationParseContext } from "./AnnotationParseContext.js";
import type { Annotation } from "./AnnotationTypeMap.js";
import { CoordinateSpace } from "./CoordinateSpace.js";
import { JsonObjectReader } from "./JsonObjectReader.js";

/**
 * Validates annotation documents of `spec/annotation.md` and builds their
 * annotations through the registered plugins.
 */
export class AnnotationDocumentParser {
  /** Format revision this parser reads. */
  static readonly FORMAT_VERSION: number = 1;

  private static readonly COORDINATE_SPACES_BY_NAME: ReadonlyMap<string, CoordinateSpace> = new Map(
    Object.values(CoordinateSpace).map((space: CoordinateSpace): [string, CoordinateSpace] => [space, space]),
  );

  private readonly registry: AnnotationPluginRegistry;

  /**
   * Bind the parser to the plugins that build each kind.
   *
   * @param registry - Plugins by kind; defaults to the built-in kinds.
   */
  constructor(registry: AnnotationPluginRegistry = AnnotationPluginRegistry.withBuiltins()) {
    this.registry = registry;
  }

  /**
   * Parse a document from JSON text.
   *
   * @param text - JSON text of the document.
   * @returns The parsed document.
   * @throws SyntaxError When the text is not JSON.
   * @throws AnnotationFormatError When the document breaks the format.
   */
  parseText(text: string): AnnotationDocument {
    const value: unknown = JSON.parse(text);
    return this.parse(value);
  }

  /**
   * Parse a document from an already decoded JSON value.
   *
   * @param value - Decoded JSON value of the document.
   * @returns The parsed document.
   * @throws AnnotationFormatError When the document breaks the format.
   */
  parse(value: unknown): AnnotationDocument {
    const root: JsonObjectReader = JsonObjectReader.from(value);
    const formatVersion: number = root.requireInteger("formatVersion");
    if (formatVersion !== AnnotationDocumentParser.FORMAT_VERSION) {
      throw root.errorAt(
        "formatVersion",
        `unsupported version ${formatVersion}; this parser reads version ${AnnotationDocumentParser.FORMAT_VERSION}`,
      );
    }
    const context: AnnotationParseContext = this.readContext(root);
    const frames: Map<number, readonly Annotation[]> = new Map();
    for (const frameReader of root.requireObjectArray("frames")) {
      const timeId: number = frameReader.requireInteger("timeId");
      if (timeId < 0) {
        throw frameReader.errorAt("timeId", `must not be negative, given: ${timeId}`);
      }
      if (frames.has(timeId)) {
        throw frameReader.errorAt("timeId", `duplicates an earlier frame with timeId ${timeId}`);
      }
      frames.set(
        timeId,
        frameReader
          .requireObjectArray("annotations")
          .map((annotationReader: JsonObjectReader) => this.parseAnnotation(annotationReader, context)),
      );
    }
    return { frames };
  }

  private parseAnnotation(reader: JsonObjectReader, context: AnnotationParseContext): Annotation {
    const kind: string = reader.requireString("kind");
    if (!this.registry.has(kind)) {
      throw reader.errorAt("kind", `no plugin registered for kind "${kind}"; registered kinds: ${this.registry.kinds().join(", ")}`);
    }
    return this.registry.get(kind).parse(reader, context);
  }

  private readContext(root: JsonObjectReader): AnnotationParseContext {
    const coordinateSpace: CoordinateSpace = AnnotationDocumentParser.readCoordinateSpace(root);
    const frameSizeReader: JsonObjectReader | undefined = root.optionalObject("frameSize");
    let frameSize: Size | null = null;
    if (frameSizeReader !== undefined) {
      const width: number = frameSizeReader.requireNumber("width");
      const height: number = frameSizeReader.requireNumber("height");
      if (!(width > 0 && height > 0)) {
        throw root.errorAt("frameSize", `must be positive, given: ${width}x${height}`);
      }
      frameSize = { width, height };
    }
    if (coordinateSpace === CoordinateSpace.PIXEL && frameSize === null) {
      throw root.errorAt("frameSize", "is required when coordinateSpace is pixel");
    }
    return new AnnotationParseContext(coordinateSpace, frameSize);
  }

  private static readCoordinateSpace(root: JsonObjectReader): CoordinateSpace {
    const value: string | undefined = root.optionalString("coordinateSpace");
    if (value === undefined) {
      return CoordinateSpace.NORMALIZED;
    }
    const coordinateSpace: CoordinateSpace | undefined = AnnotationDocumentParser.COORDINATE_SPACES_BY_NAME.get(value);
    if (coordinateSpace === undefined) {
      throw root.errorAt("coordinateSpace", `expected one of ${Object.values(CoordinateSpace).join(", ")}, given: ${value}`);
    }
    return coordinateSpace;
  }
}
