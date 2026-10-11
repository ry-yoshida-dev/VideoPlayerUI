/**
 * Stand-in for the browser `WebSocket` that the test opens and feeds by hand.
 */
export class FakeWebSocket {
  static readonly CONNECTING: number = 0;
  static readonly OPEN: number = 1;
  static readonly CLOSED: number = 3;
  static readonly instances: FakeWebSocket[] = [];

  readonly url: string;
  readonly sent: (string | ArrayBuffer)[] = [];
  binaryType: string = "blob";
  readyState: number = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { readonly data: unknown }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  static install(): void {
    FakeWebSocket.instances.length = 0;
    Object.defineProperty(globalThis, "WebSocket", { value: FakeWebSocket, configurable: true, writable: true });
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(text: string): void {
    this.onmessage?.({ data: text });
  }

  send(data: string | ArrayBuffer): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
}
