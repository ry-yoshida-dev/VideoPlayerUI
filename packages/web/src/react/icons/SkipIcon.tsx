import type { ReactElement } from "react";

import { SkipDirection } from "./SkipDirection.js";
import type { SkipIconProps } from "./SkipIconProps.js";

/**
 * Circular arrow with the skip distance inside it.
 *
 * @param props - Direction, distance and size.
 * @returns The SVG element.
 */
export function SkipIcon({ direction, seconds, size = 24 }: SkipIconProps): ReactElement {
  const isForward: boolean = direction === SkipDirection.FORWARD;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={isForward ? "matrix(-1 0 0 1 24 0)" : undefined}>
        <path d="M4.5 9.5A8.5 8.5 0 1 1 3.5 13" />
        <path d="M4 4.5v5h5" />
      </g>
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {seconds}
      </text>
    </svg>
  );
}
