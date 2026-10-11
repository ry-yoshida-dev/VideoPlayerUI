/**
 * Stands in for `fetch`, serving one file with or without range support and
 * recording what was requested.
 */
export class FakeRangeServer {
  readonly requests: RequestInit[] = [];
  servedBytes: number = 0;
  private readonly bytes: Uint8Array<ArrayBuffer>;
  private readonly isRangeSupported: boolean;
  private originalFetch: typeof fetch | null = null;

  constructor(bytes: Uint8Array<ArrayBuffer>, isRangeSupported: boolean = true) {
    this.bytes = bytes;
    this.isRangeSupported = isRangeSupported;
  }

  install(): void {
    this.originalFetch = globalThis.fetch;
    globalThis.fetch = (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => Promise.resolve(this.respond(init ?? {}));
  }

  uninstall(): void {
    if (this.originalFetch !== null) {
      globalThis.fetch = this.originalFetch;
    }
  }

  private respond(init: RequestInit): Response {
    this.requests.push(init);
    const range: string | undefined = (init.headers as Record<string, string> | undefined)?.["Range"];
    const match: RegExpExecArray | null = range === undefined ? null : /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!this.isRangeSupported || match === null) {
      this.servedBytes += this.bytes.length;
      return new Response(this.bytes, { status: 200 });
    }
    const start: number = Number(match[1]);
    const end: number = Math.min(Number(match[2]), this.bytes.length - 1);
    if (start >= this.bytes.length) {
      return new Response(null, { status: 416 });
    }
    const body: Uint8Array<ArrayBuffer> = this.bytes.slice(start, end + 1);
    this.servedBytes += body.length;
    return new Response(body, { status: 206, headers: { "Content-Range": `bytes ${start}-${end}/${this.bytes.length}` } });
  }
}
