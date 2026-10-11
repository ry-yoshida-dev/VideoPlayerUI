import type { Annotation } from "@video-player-ui/annotations";

import type { AnalysisRequest } from "../AnalysisRequest.js";
import type { FrameAnalyzer } from "../FrameAnalyzer.js";
import { AnalysisServerError } from "./AnalysisServerError.js";
import type { AnalysisResponse } from "./AnalysisResponse.js";
import type { PendingRequest } from "./PendingRequest.js";
import { RequestEncoder } from "./RequestEncoder.js";
import { ResponseDecoder } from "./ResponseDecoder.js";
import { ResponseKind } from "./ResponseKind.js";
import type { WebSocketFrameAnalyzerOptions } from "./WebSocketFrameAnalyzerOptions.js";

/**
 * {@link FrameAnalyzer} talking to an analysis server over WebSocket, as
 * described in `spec/analysis-protocol.md`.
 *
 * Connects on the first request and reconnects on the next request after the
 * connection drops or is closed.
 */
export class WebSocketFrameAnalyzer implements FrameAnalyzer {
  /** Request id of failures the server cannot attribute to one request. */
  static readonly UNATTRIBUTED_REQUEST_ID: number = -1;

  private readonly url: string;
  private readonly timeoutMilliseconds: number;
  private readonly encoder: RequestEncoder = new RequestEncoder();
  private readonly decoder: ResponseDecoder;
  private readonly pending: Map<number, PendingRequest> = new Map();
  private socket: WebSocket | null = null;
  private connecting: Promise<WebSocket> | null = null;
  private nextRequestId: number = 1;

  /**
   * Store the server address.
   *
   * @param options - URL, timeout and annotation parser.
   * @throws RangeError When the timeout is not positive.
   */
  constructor(options: WebSocketFrameAnalyzerOptions) {
    this.url = options.url;
    this.timeoutMilliseconds = options.timeoutMilliseconds ?? 10_000;
    this.decoder = new ResponseDecoder(options.parser);
    if (!(this.timeoutMilliseconds > 0)) {
      throw new RangeError(`timeoutMilliseconds must be positive, given: ${this.timeoutMilliseconds}`);
    }
  }

  async analyze(request: AnalysisRequest): Promise<readonly Annotation[]> {
    const socket: WebSocket = await this.connect();
    const requestId: number = this.nextRequestId;
    this.nextRequestId += 1;
    const result: Promise<readonly Annotation[]> = new Promise<readonly Annotation[]>(
      (resolve: (annotations: readonly Annotation[]) => void, reject: (error: Error) => void) => {
        const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
          this.pending.delete(requestId);
          reject(new AnalysisServerError(`The analysis server did not answer within ${this.timeoutMilliseconds} ms`));
        }, this.timeoutMilliseconds);
        this.pending.set(requestId, { resolve, reject, timer });
      },
    );
    socket.send(this.encoder.encode(requestId, request));
    return result;
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
    this.rejectAll(new AnalysisServerError("The connection was closed"));
  }

  private connect(): Promise<WebSocket> {
    if (this.socket !== null && this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.socket);
    }
    if (this.connecting !== null) {
      return this.connecting;
    }
    this.connecting = new Promise<WebSocket>((resolve: (socket: WebSocket) => void, reject: (error: Error) => void) => {
      const socket: WebSocket = new WebSocket(this.url);
      socket.binaryType = "arraybuffer";
      socket.onopen = (): void => {
        this.socket = socket;
        this.connecting = null;
        resolve(socket);
      };
      socket.onerror = (): void => {
        this.connecting = null;
        reject(new AnalysisServerError(`Cannot connect to the analysis server at ${this.url}`));
      };
      socket.onclose = (): void => {
        if (this.socket === socket) {
          this.socket = null;
        }
        this.rejectAll(new AnalysisServerError("The connection to the analysis server closed"));
      };
      socket.onmessage = (event: MessageEvent): void => {
        this.handleMessage(event.data);
      };
    });
    return this.connecting;
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== "string") {
      return;
    }
    let response: AnalysisResponse;
    try {
      response = this.decoder.decode(data);
    } catch (error: unknown) {
      this.rejectAll(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    if (response.kind === ResponseKind.ERROR && response.requestId === WebSocketFrameAnalyzer.UNATTRIBUTED_REQUEST_ID) {
      this.rejectAll(new AnalysisServerError(response.message));
      return;
    }
    const request: PendingRequest | undefined = this.pending.get(response.requestId);
    if (request === undefined) {
      return;
    }
    this.pending.delete(response.requestId);
    clearTimeout(request.timer);
    switch (response.kind) {
      case ResponseKind.RESULT:
        request.resolve(response.annotations);
        return;
      case ResponseKind.ERROR:
        request.reject(new AnalysisServerError(response.message));
        return;
    }
  }

  private rejectAll(error: Error): void {
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    this.pending.clear();
  }
}
