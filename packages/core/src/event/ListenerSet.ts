import type { Unsubscribe } from "./Unsubscribe.js";

/**
 * Ordered set of listeners notified with one payload.
 *
 * @typeParam TPayload - Value passed to every listener.
 */
export class ListenerSet<TPayload> {
  private readonly listeners: Set<(payload: TPayload) => void> = new Set();

  /**
   * Register a listener.
   *
   * @param listener - Called on every {@link ListenerSet.notify}.
   * @returns A function removing the listener.
   */
  add(listener: (payload: TPayload) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Call every registered listener with the payload.
   *
   * @param payload - Value passed to the listeners.
   */
  notify(payload: TPayload): void {
    for (const listener of [...this.listeners]) {
      listener(payload);
    }
  }

  /**
   * Remove every listener.
   */
  clear(): void {
    this.listeners.clear();
  }
}
