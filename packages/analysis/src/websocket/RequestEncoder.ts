import type { AnalysisRequest } from "../AnalysisRequest.js";

/**
 * Encodes requests as the binary messages of `spec/analysis-protocol.md`.
 */
export class RequestEncoder {
  private static readonly HEADER_LENGTH_BYTES: number = 4;
  private readonly textEncoder: TextEncoder = new TextEncoder();

  /**
   * Build the message of one request.
   *
   * @param requestId - Identifier echoed by the server.
   * @param request - Frame and time id.
   * @returns The binary message.
   */
  encode(requestId: number, request: AnalysisRequest): ArrayBuffer {
    const header: Uint8Array = this.textEncoder.encode(
      JSON.stringify({
        type: "analyze",
        requestId,
        timeId: request.timeId,
        mimeType: request.frame.mimeType,
        width: request.frame.width,
        height: request.frame.height,
      }),
    );
    const image: Uint8Array = new Uint8Array(request.frame.bytes);
    const buffer: ArrayBuffer = new ArrayBuffer(RequestEncoder.HEADER_LENGTH_BYTES + header.byteLength + image.byteLength);
    const message: Uint8Array = new Uint8Array(buffer);
    new DataView(buffer).setUint32(0, header.byteLength, false);
    message.set(header, RequestEncoder.HEADER_LENGTH_BYTES);
    message.set(image, RequestEncoder.HEADER_LENGTH_BYTES + header.byteLength);
    return buffer;
  }
}
