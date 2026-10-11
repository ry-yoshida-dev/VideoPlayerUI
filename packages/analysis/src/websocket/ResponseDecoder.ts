import { AnnotationDocumentParser, JsonObjectReader } from "@video-player-ui/annotations";
import type { Annotation, AnnotationDocument } from "@video-player-ui/annotations";

import type { AnalysisResponse } from "./AnalysisResponse.js";
import { ResponseKind } from "./ResponseKind.js";

/**
 * Decodes the text messages of `spec/analysis-protocol.md`.
 */
export class ResponseDecoder {
  private static readonly KINDS_BY_TYPE: ReadonlyMap<string, ResponseKind> = new Map(
    Object.values(ResponseKind).map((kind: ResponseKind): [string, ResponseKind] => [kind, kind]),
  );

  private readonly parser: AnnotationDocumentParser;

  /**
   * Bind the decoder to the plugins that parse annotation kinds.
   *
   * @param parser - Annotation parser; defaults to the built-in kinds.
   */
  constructor(parser: AnnotationDocumentParser = new AnnotationDocumentParser()) {
    this.parser = parser;
  }

  /**
   * Decode one message.
   *
   * @param text - JSON text sent by the server.
   * @returns The result or failure it carries.
   * @throws SyntaxError When the text is not JSON.
   * @throws AnnotationFormatError When the message breaks the protocol.
   */
  decode(text: string): AnalysisResponse {
    const value: unknown = JSON.parse(text);
    const reader: JsonObjectReader = JsonObjectReader.from(value);
    const kind: ResponseKind = ResponseDecoder.readKind(reader);
    const requestId: number = reader.requireInteger("requestId");
    switch (kind) {
      case ResponseKind.ERROR:
        return { kind, requestId, message: reader.requireString("message") };
      case ResponseKind.RESULT: {
        const timeId: number = reader.requireInteger("timeId");
        const document: AnnotationDocument = this.parser.parse({
          formatVersion: AnnotationDocumentParser.FORMAT_VERSION,
          ...(reader.has("coordinateSpace") ? { coordinateSpace: reader.raw("coordinateSpace") } : {}),
          ...(reader.has("frameSize") ? { frameSize: reader.raw("frameSize") } : {}),
          frames: [{ timeId, annotations: reader.requireArray("annotations") }],
        });
        const annotations: readonly Annotation[] = document.frames.get(timeId) ?? [];
        return { kind, requestId, timeId, annotations };
      }
    }
  }

  private static readKind(reader: JsonObjectReader): ResponseKind {
    const type: string = reader.requireString("type");
    const kind: ResponseKind | undefined = ResponseDecoder.KINDS_BY_TYPE.get(type);
    if (kind === undefined) {
      throw reader.errorAt("type", `expected one of ${Object.values(ResponseKind).join(", ")}, given: ${type}`);
    }
    return kind;
  }
}
