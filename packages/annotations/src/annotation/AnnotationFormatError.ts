/**
 * Raised when annotation data breaks the format of `spec/annotation.md`.
 */
export class AnnotationFormatError extends TypeError {
  /** JSON path of the offending value, such as `$.frames[3].annotations[0].box`. */
  readonly path: string;

  /**
   * Describe a format violation.
   *
   * @param path - JSON path of the offending value.
   * @param message - What is wrong with the value.
   */
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "AnnotationFormatError";
    this.path = path;
  }
}
