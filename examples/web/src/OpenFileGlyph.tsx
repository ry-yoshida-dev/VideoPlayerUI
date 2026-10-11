import type { ReactElement } from "react";

/**
 * Monochrome open-folder glyph of the video picker, drawn in the current text color.
 *
 * @returns The SVG element.
 */
export function OpenFileGlyph(): ReactElement {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h13.2a1.5 1.5 0 0 0 1.45-1.1l1.8-6.6A1 1 0 0 0 20 10.5H8.2a1.5 1.5 0 0 0-1.45 1.1L4.5 19.5" />
      <path d="M18 10.5V9a1.5 1.5 0 0 0-1.5-1.5h-5.6L9.2 5.4A1.5 1.5 0 0 0 8 4.5H4.5A1.5 1.5 0 0 0 3 6v1.5" />
    </svg>
  );
}
