import type { ReactElement } from "react";

import { IconName } from "./IconName.js";
import type { IconProps } from "./IconProps.js";

/**
 * Glyph of a built-in control, drawn in the current text color.
 *
 * @param props - Glyph and size.
 * @returns The SVG element.
 */
export function Icon({ name, size = 24 }: IconProps): ReactElement {
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
      {glyphOf(name)}
    </svg>
  );
}

function glyphOf(name: IconName): ReactElement {
  switch (name) {
    case IconName.PLAY:
      return <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />;
    case IconName.PAUSE:
      return (
        <g fill="currentColor" stroke="none">
          <rect x="6" y="4.5" width="4" height="15" rx="1" />
          <rect x="14" y="4.5" width="4" height="15" rx="1" />
        </g>
      );
    case IconName.REPLAY:
      return (
        <g>
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
          <path d="M10 9v6l5-3z" fill="currentColor" stroke="none" />
        </g>
      );
    case IconName.STEP_BACKWARD:
      return (
        <g fill="currentColor" stroke="none">
          <rect x="5" y="6" width="2.5" height="12" rx="1" />
          <path d="M19 6v12l-9.5-6z" />
        </g>
      );
    case IconName.STEP_FORWARD:
      return (
        <g fill="currentColor" stroke="none">
          <rect x="16.5" y="6" width="2.5" height="12" rx="1" />
          <path d="M5 6v12l9.5-6z" />
        </g>
      );
    case IconName.VOLUME:
      return (
        <g>
          <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </g>
      );
    case IconName.VOLUME_MUTED:
      return (
        <g>
          <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
          <path d="m16 9 6 6" />
          <path d="m22 9-6 6" />
        </g>
      );
    case IconName.FULLSCREEN:
      return <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />;
    case IconName.FULLSCREEN_EXIT:
      return <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />;
    case IconName.LOOP:
      return (
        <g>
          <path d="m17 2 4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </g>
      );
    case IconName.LAYERS:
      return (
        <g>
          <path d="M12 3 2 8l10 5 10-5z" fill="currentColor" fillOpacity={0.35} />
          <path d="m2 13 10 5 10-5" />
        </g>
      );
    case IconName.LAYERS_HIDDEN:
      return (
        <g>
          <path d="M12 3 2 8l10 5 10-5z" />
          <path d="m2 13 10 5 10-5" />
          <path d="M3 3l18 18" />
        </g>
      );
    case IconName.COPY:
      return (
        <g>
          <rect x="8" y="8" width="13" height="13" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </g>
      );
    case IconName.TAG:
      return (
        <g>
          <path d="M3 4.5V11a1.5 1.5 0 0 0 .44 1.06l8.5 8.5a1.5 1.5 0 0 0 2.12 0l6.5-6.5a1.5 1.5 0 0 0 0-2.12l-8.5-8.5A1.5 1.5 0 0 0 11 3H4.5A1.5 1.5 0 0 0 3 4.5z" />
          <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
        </g>
      );
    case IconName.TAG_HIDDEN:
      return (
        <g>
          <path d="M3 4.5V11a1.5 1.5 0 0 0 .44 1.06l8.5 8.5a1.5 1.5 0 0 0 2.12 0l6.5-6.5a1.5 1.5 0 0 0 0-2.12l-8.5-8.5A1.5 1.5 0 0 0 11 3H4.5A1.5 1.5 0 0 0 3 4.5z" />
          <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
          <path d="M3 3l18 18" />
        </g>
      );
    case IconName.CHECK:
      return <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />;
    case IconName.WARNING:
      return (
        <g>
          <path d="M12 3 2 20h20z" />
          <path d="M12 10v4" />
          <path d="M12 17v.01" />
        </g>
      );
  }
}
