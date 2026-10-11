/**
 * Raised when a command needs a state the player is not in, such as seeking before loading.
 */
export class PlayerStateError extends Error {
  /**
   * Describe the misuse.
   *
   * @param message - Which command needed which state.
   * @param options - Underlying error that put the player in its state, if any.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PlayerStateError";
  }
}
