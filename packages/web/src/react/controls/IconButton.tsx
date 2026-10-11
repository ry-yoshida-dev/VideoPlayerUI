import type { ReactElement } from "react";

import type { IconButtonProps } from "./IconButtonProps.js";

/**
 * Round, borderless button holding a single glyph.
 *
 * @param props - Label, glyph, action and state.
 * @returns The button element.
 */
export function IconButton({ label, children, onClick, isPressed, isPrimary = false, isOptional = false }: IconButtonProps): ReactElement {
  return (
    <button
      type="button"
      className={isOptional ? "vpui-button vpui-optional" : "vpui-button"}
      aria-label={label}
      data-vpui-tooltip={label}
      aria-pressed={isPressed}
      data-primary={isPrimary}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
