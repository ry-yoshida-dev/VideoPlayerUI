/**
 * Canvas whose encoding yields a one-byte image, enough for code that only
 * needs `toBlob` to succeed.
 */
class FakeCanvas {
  width: number = 0;
  height: number = 0;

  getContext(): { drawImage: () => void } {
    return { drawImage: (): void => undefined };
  }

  toBlob(callback: (blob: Blob | null) => void, type: string): void {
    callback(new Blob([new Uint8Array(1)], { type }));
  }
}

/**
 * Install a global `document` that creates {@link FakeCanvas} elements, which Node lacks.
 */
export function installFakeCanvasDocument(): void {
  Object.defineProperty(globalThis, "document", {
    value: { createElement: (): FakeCanvas => new FakeCanvas() },
    configurable: true,
    writable: true,
  });
}
