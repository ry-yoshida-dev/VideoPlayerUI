import type { AnnotationCommonFields } from "./AnnotationCommonFields.js";

/**
 * Shape shared by every annotation: a kind tag and the common fields.
 *
 * @typeParam TKind - Kind tag of the annotation.
 */
export interface AnnotationBase<TKind extends string> extends AnnotationCommonFields {
  readonly kind: TKind;
}
