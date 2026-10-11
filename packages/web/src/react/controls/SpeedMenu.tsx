import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import type { SpeedMenuProps } from "./SpeedMenuProps.js";

/**
 * Chip showing the speed, such as `1×`, opening a list of speeds above it.
 *
 * @param props - Current speed, choices and callbacks.
 * @returns The menu element.
 */
export function SpeedMenu({ playbackRate, playbackRates, label, onSelect }: SpeedMenuProps): ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const anchorRef: { current: HTMLDivElement | null } = useRef<HTMLDivElement | null>(null);
  const sortedRates: readonly number[] = [...playbackRates].sort((left: number, right: number) => right - left);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const onPointerDown: (event: PointerEvent) => void = (event: PointerEvent): void => {
      if (!(event.target instanceof Node) || !anchorRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  return (
    <div className="vpui-menu-anchor" ref={anchorRef}>
      <button
        type="button"
        className="vpui-chip"
        aria-label={label}
        data-vpui-tooltip={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-muted={playbackRate === 1}
        onClick={() => setIsOpen(!isOpen)}
      >
        {`${playbackRate}×`}
      </button>
      {isOpen && (
        <div className="vpui-menu" role="menu" aria-label={label}>
          {sortedRates.map((rate: number) => (
            <button
              key={rate}
              type="button"
              role="menuitemradio"
              className="vpui-menu-item"
              aria-checked={rate === playbackRate}
              onClick={() => {
                onSelect(rate);
                setIsOpen(false);
              }}
            >
              {`${rate}×`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
