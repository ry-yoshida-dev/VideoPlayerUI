import { PlayerAction } from "./PlayerAction.js";

/**
 * Mapping from `KeyboardEvent.key` values to player commands.
 */
export class KeyboardShortcuts {
  /** Bindings of the built-in controls. */
  static readonly DEFAULT_BINDINGS: ReadonlyMap<string, PlayerAction> = new Map([
    [" ", PlayerAction.TOGGLE_PLAYBACK],
    ["k", PlayerAction.TOGGLE_PLAYBACK],
    ["ArrowLeft", PlayerAction.SKIP_BACKWARD],
    ["j", PlayerAction.SKIP_BACKWARD],
    ["ArrowRight", PlayerAction.SKIP_FORWARD],
    ["l", PlayerAction.SKIP_FORWARD],
    [",", PlayerAction.STEP_BACKWARD],
    [".", PlayerAction.STEP_FORWARD],
    ["m", PlayerAction.TOGGLE_MUTE],
    ["f", PlayerAction.TOGGLE_FULLSCREEN],
    ["c", PlayerAction.COPY_FRAME],
    ["g", PlayerAction.FOCUS_TIME_ID],
  ]);

  private readonly bindings: ReadonlyMap<string, PlayerAction>;

  /**
   * Store the bindings.
   *
   * @param bindings - Command of each key; letter keys match either case.
   */
  constructor(bindings: ReadonlyMap<string, PlayerAction> = KeyboardShortcuts.DEFAULT_BINDINGS) {
    this.bindings = bindings;
  }

  /**
   * Command bound to a key press, ignoring presses with Ctrl, Alt or Meta.
   *
   * @param event - The key press.
   * @returns The command, or null when the key is unbound.
   */
  actionFor(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "metaKey">): PlayerAction | null {
    const key: string | null = KeyboardShortcuts.keyOf(event);
    return key === null ? null : (this.bindings.get(key) ?? null);
  }

  /**
   * Normalized key of a key press: letters in lower case, other keys as reported.
   *
   * @param event - The key press.
   * @returns The key, or null for presses with Ctrl, Alt or Meta.
   */
  static keyOf(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "metaKey">): string | null {
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return null;
    }
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }
}
