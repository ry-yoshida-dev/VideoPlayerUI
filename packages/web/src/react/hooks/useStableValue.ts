import { useRef } from "react";

/**
 * Keep the same reference for a plain-data value across renders until its
 * JSON form changes, so inline option objects do not invalidate memoization.
 *
 * @typeParam TValue - JSON-serializable value, such as an options object.
 * @param value - Value of the current render.
 * @returns The first value passed with the current JSON form.
 */
export function useStableValue<TValue>(value: TValue): TValue {
  const key: string = JSON.stringify(value);
  const storedRef: { current: { readonly key: string; readonly value: TValue } } = useRef({ key, value });
  if (storedRef.current.key !== key) {
    storedRef.current = { key, value };
  }
  return storedRef.current.value;
}
