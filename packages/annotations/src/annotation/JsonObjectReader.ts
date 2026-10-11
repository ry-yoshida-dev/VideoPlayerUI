import { AnnotationFormatError } from "./AnnotationFormatError.js";

/**
 * Typed, path-aware access to the fields of one JSON object.
 *
 * Every accessor validates the field's type and raises
 * {@link AnnotationFormatError} with the field's path when it does not match.
 */
export class JsonObjectReader {
  /** JSON path of the object. */
  readonly path: string;
  private readonly fields: Readonly<Record<string, unknown>>;

  private constructor(fields: Readonly<Record<string, unknown>>, path: string) {
    this.fields = fields;
    this.path = path;
  }

  /**
   * Wrap a value that must be a JSON object.
   *
   * @param value - Value to wrap.
   * @param path - JSON path of the value.
   * @returns The reader.
   * @throws AnnotationFormatError When the value is not an object.
   */
  static from(value: unknown, path: string = "$"): JsonObjectReader {
    if (!JsonObjectReader.isRecord(value)) {
      throw new AnnotationFormatError(path, `expected an object, got ${JsonObjectReader.describe(value)}`);
    }
    return new JsonObjectReader(value, path);
  }

  /**
   * Whether the object has a field.
   *
   * @param key - Field name.
   * @returns True when the field is present, even if null.
   */
  has(key: string): boolean {
    return Object.hasOwn(this.fields, key);
  }

  /**
   * Raw value of a field, for plugins with their own validation.
   *
   * @param key - Field name.
   * @returns The value, or undefined when the field is absent.
   */
  raw(key: string): unknown {
    return this.has(key) ? this.fields[key] : undefined;
  }

  /**
   * JSON path of a field.
   *
   * @param key - Field name.
   * @returns The path.
   */
  pathOf(key: string): string {
    return `${this.path}.${key}`;
  }

  /**
   * Read a required string field.
   *
   * @param key - Field name.
   * @returns The string.
   * @throws AnnotationFormatError When the field is absent or not a string.
   */
  requireString(key: string): string {
    const value: unknown = this.require(key);
    if (typeof value !== "string") {
      throw this.typeError(key, "a string", value);
    }
    return value;
  }

  /**
   * Read an optional string field.
   *
   * @param key - Field name.
   * @returns The string, or undefined when absent.
   * @throws AnnotationFormatError When the field is present and not a string.
   */
  optionalString(key: string): string | undefined {
    return this.has(key) ? this.requireString(key) : undefined;
  }

  /**
   * Read a required finite number field.
   *
   * @param key - Field name.
   * @returns The number.
   * @throws AnnotationFormatError When the field is absent or not a finite number.
   */
  requireNumber(key: string): number {
    const value: unknown = this.require(key);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw this.typeError(key, "a finite number", value);
    }
    return value;
  }

  /**
   * Read an optional finite number field.
   *
   * @param key - Field name.
   * @returns The number, or undefined when absent.
   * @throws AnnotationFormatError When the field is present and not a finite number.
   */
  optionalNumber(key: string): number | undefined {
    return this.has(key) ? this.requireNumber(key) : undefined;
  }

  /**
   * Read a required integer field.
   *
   * @param key - Field name.
   * @returns The integer.
   * @throws AnnotationFormatError When the field is absent or not an integer.
   */
  requireInteger(key: string): number {
    const value: number = this.requireNumber(key);
    if (!Number.isInteger(value)) {
      throw this.typeError(key, "an integer", value);
    }
    return value;
  }

  /**
   * Read an optional boolean field.
   *
   * @param key - Field name.
   * @returns The boolean, or undefined when absent.
   * @throws AnnotationFormatError When the field is present and not a boolean.
   */
  optionalBoolean(key: string): boolean | undefined {
    if (!this.has(key)) {
      return undefined;
    }
    const value: unknown = this.fields[key];
    if (typeof value !== "boolean") {
      throw this.typeError(key, "a boolean", value);
    }
    return value;
  }

  /**
   * Read a required object field.
   *
   * @param key - Field name.
   * @returns A reader over the nested object.
   * @throws AnnotationFormatError When the field is absent or not an object.
   */
  requireObject(key: string): JsonObjectReader {
    return JsonObjectReader.from(this.require(key), this.pathOf(key));
  }

  /**
   * Read an optional object field.
   *
   * @param key - Field name.
   * @returns A reader over the nested object, or undefined when absent.
   * @throws AnnotationFormatError When the field is present and not an object.
   */
  optionalObject(key: string): JsonObjectReader | undefined {
    return this.has(key) ? this.requireObject(key) : undefined;
  }

  /**
   * Read a required array field.
   *
   * @param key - Field name.
   * @returns The array items.
   * @throws AnnotationFormatError When the field is absent or not an array.
   */
  requireArray(key: string): readonly unknown[] {
    const value: unknown = this.require(key);
    if (!Array.isArray(value)) {
      throw this.typeError(key, "an array", value);
    }
    return value;
  }

  /**
   * Read a required array of objects.
   *
   * @param key - Field name.
   * @returns A reader over each item.
   * @throws AnnotationFormatError When the field is not an array of objects.
   */
  requireObjectArray(key: string): readonly JsonObjectReader[] {
    return this.requireArray(key).map((item: unknown, index: number) => JsonObjectReader.from(item, `${this.pathOf(key)}[${index}]`));
  }

  /**
   * Read an optional array of objects.
   *
   * @param key - Field name.
   * @returns A reader over each item, or an empty list when absent.
   * @throws AnnotationFormatError When the field is present and not an array of objects.
   */
  optionalObjectArray(key: string): readonly JsonObjectReader[] {
    return this.has(key) ? this.requireObjectArray(key) : [];
  }

  /**
   * Names of the object's fields.
   *
   * @returns The field names.
   */
  keys(): readonly string[] {
    return Object.keys(this.fields);
  }

  /**
   * Build a format error located at a field.
   *
   * @param key - Field name.
   * @param message - What is wrong with the field.
   * @returns The error, for the caller to throw.
   */
  errorAt(key: string, message: string): AnnotationFormatError {
    return new AnnotationFormatError(this.pathOf(key), message);
  }

  private require(key: string): unknown {
    if (!this.has(key)) {
      throw new AnnotationFormatError(this.pathOf(key), "is required");
    }
    return this.fields[key];
  }

  private typeError(key: string, expected: string, value: unknown): AnnotationFormatError {
    return this.errorAt(key, `expected ${expected}, got ${JsonObjectReader.describe(value)}`);
  }

  private static isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private static describe(value: unknown): string {
    if (value === null) {
      return "null";
    }
    if (Array.isArray(value)) {
      return "an array";
    }
    if (JsonObjectReader.isRecord(value)) {
      return "an object";
    }
    return typeof value === "string" ? `the string "${value}"` : `${typeof value} ${JSON.stringify(value)}`;
  }
}
