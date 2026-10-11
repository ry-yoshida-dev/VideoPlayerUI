/**
 * Frame emitted by {@link FakeVideoDecoder}, recording whether it was released.
 */
export class FakeVideoFrame {
  readonly timestamp: number;
  isClosed: boolean = false;

  constructor(timestamp: number) {
    this.timestamp = timestamp;
  }

  close(): void {
    this.isClosed = true;
  }
}

/**
 * Chunk accepted by {@link FakeVideoDecoder}.
 */
export class FakeEncodedVideoChunk {
  readonly type: EncodedVideoChunkType;
  readonly timestamp: number;
  readonly byteLength: number;

  constructor(init: EncodedVideoChunkInit) {
    this.type = init.type;
    this.timestamp = init.timestamp;
    this.byteLength = ArrayBuffer.isView(init.data) ? init.data.byteLength : init.data.byteLength;
  }
}

/**
 * Decoder that emits one frame per chunk in presentation order, holding back
 * a few frames the way decoders reorder B-frames.
 */
export class FakeVideoDecoder extends EventTarget {
  static readonly REORDER_DEPTH: number = 2;
  static readonly instances: FakeVideoDecoder[] = [];

  state: CodecState = "unconfigured";
  readonly decodeQueueSize: number = 0;
  readonly chunks: FakeEncodedVideoChunk[] = [];
  readonly frames: FakeVideoFrame[] = [];
  private readonly reorderBuffer: FakeVideoFrame[] = [];
  private readonly output: (frame: FakeVideoFrame) => void;
  private readonly error: (error: DOMException) => void;

  constructor(init: { output: (frame: FakeVideoFrame) => void; error: (error: DOMException) => void }) {
    super();
    this.output = init.output;
    this.error = init.error;
    FakeVideoDecoder.instances.push(this);
  }

  configure(): void {
    this.state = "configured";
  }

  decode(chunk: FakeEncodedVideoChunk): void {
    if (this.chunks.length === 0 && chunk.type !== "key") {
      this.error(new DOMException("A key frame is required after configure", "DataError"));
      return;
    }
    this.chunks.push(chunk);
    this.reorderBuffer.push(new FakeVideoFrame(chunk.timestamp));
    if (this.reorderBuffer.length > FakeVideoDecoder.REORDER_DEPTH) {
      this.emitEarliest();
    }
  }

  flush(): Promise<void> {
    while (this.reorderBuffer.length > 0) {
      this.emitEarliest();
    }
    return Promise.resolve();
  }

  close(): void {
    this.state = "closed";
  }

  private emitEarliest(): void {
    this.reorderBuffer.sort((left: FakeVideoFrame, right: FakeVideoFrame) => left.timestamp - right.timestamp);
    const frame: FakeVideoFrame | undefined = this.reorderBuffer.shift();
    if (frame !== undefined) {
      this.frames.push(frame);
      this.output(frame);
    }
  }
}

/**
 * Install the fakes as the global WebCodecs classes, which Node lacks.
 */
export function installFakeWebCodecs(): void {
  FakeVideoDecoder.instances.length = 0;
  Object.defineProperty(globalThis, "VideoDecoder", { value: FakeVideoDecoder, configurable: true, writable: true });
  Object.defineProperty(globalThis, "EncodedVideoChunk", { value: FakeEncodedVideoChunk, configurable: true, writable: true });
}
