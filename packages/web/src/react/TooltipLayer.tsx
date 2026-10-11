import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import type { Tooltip } from "./Tooltip.js";
import type { TooltipLayerProps } from "./TooltipLayerProps.js";

const TOOLTIP_ATTRIBUTE: string = "data-vpui-tooltip";
const EDGE_MARGIN: number = 6;
const ANCHOR_GAP: number = 8;
const WARM_MILLISECONDS: number = 600;

/**
 * Shows the `data-vpui-tooltip` text of the element under the mouse,
 * above it and kept inside the player.
 *
 * The first tooltip waits for a short hover; moving on to the next control
 * shows its tooltip at once. Text changes while shown, such as a live
 * status, are followed. Touch and pen input never show tooltips.
 *
 * @param props - Player root and hover delay.
 * @returns The tooltip element, or nothing.
 */
export function TooltipLayer({ root, delayMilliseconds = 400 }: TooltipLayerProps): ReactElement | null {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isBelow, setIsBelow] = useState<boolean>(false);
  const tooltipRef: { current: HTMLDivElement | null } = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (root === null) {
      return undefined;
    }
    let target: HTMLElement | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let hiddenAt: number = Number.NEGATIVE_INFINITY;
    let isShown: boolean = false;
    const observer: MutationObserver = new MutationObserver(() => {
      if (target !== null && isShown) {
        show(target);
      }
    });

    const describe: (element: HTMLElement) => Tooltip | null = (element: HTMLElement): Tooltip | null => {
      const text: string | null = element.getAttribute(TOOLTIP_ATTRIBUTE);
      if (text === null || text === "") {
        return null;
      }
      const rootBox: DOMRect = root.getBoundingClientRect();
      const box: DOMRect = element.getBoundingClientRect();
      return {
        text,
        anchorX: box.left + box.width / 2 - rootBox.left,
        anchorTop: box.top - rootBox.top,
        anchorBottom: box.bottom - rootBox.top,
      };
    };
    const show: (element: HTMLElement) => void = (element: HTMLElement): void => {
      isShown = true;
      setTooltip(describe(element));
    };
    const hide: () => void = (): void => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (isShown) {
        hiddenAt = performance.now();
      }
      isShown = false;
      target = null;
      observer.disconnect();
      setTooltip(null);
    };

    const onPointerOver: (event: PointerEvent) => void = (event: PointerEvent): void => {
      if (event.pointerType !== "mouse" || !(event.target instanceof Element)) {
        return;
      }
      const element: HTMLElement | null = event.target.closest<HTMLElement>(`[${TOOLTIP_ATTRIBUTE}]`);
      if (element === target) {
        return;
      }
      const isWarm: boolean = isShown || performance.now() - hiddenAt < WARM_MILLISECONDS;
      hide();
      if (element === null || !root.contains(element)) {
        return;
      }
      target = element;
      observer.observe(element, { attributes: true, attributeFilter: [TOOLTIP_ATTRIBUTE] });
      if (isWarm) {
        show(element);
        return;
      }
      timer = setTimeout(() => {
        timer = null;
        show(element);
      }, delayMilliseconds);
    };
    const onPointerLeave: () => void = (): void => hide();
    const onPointerDown: () => void = (): void => {
      hide();
      hiddenAt = Number.NEGATIVE_INFINITY;
    };

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerleave", onPointerLeave);
    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("keydown", onPointerDown);
    return () => {
      hide();
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("keydown", onPointerDown);
    };
  }, [root, delayMilliseconds]);

  useLayoutEffect(() => {
    const element: HTMLDivElement | null = tooltipRef.current;
    if (tooltip === null || element === null || root === null) {
      return;
    }
    const width: number = element.offsetWidth;
    const left: number = tooltip.anchorX - width / 2;
    const maximumLeft: number = root.clientWidth - EDGE_MARGIN - width;
    setOffsetX(Math.max(EDGE_MARGIN, Math.min(left, maximumLeft)) - left);
    setIsBelow(tooltip.anchorTop - ANCHOR_GAP - element.offsetHeight < EDGE_MARGIN);
  }, [tooltip, root]);

  if (tooltip === null) {
    return null;
  }
  return (
    <div
      ref={tooltipRef}
      className="vpui-tooltip"
      role="tooltip"
      style={{
        left: tooltip.anchorX + offsetX,
        top: isBelow ? tooltip.anchorBottom + ANCHOR_GAP : tooltip.anchorTop - ANCHOR_GAP,
        transform: isBelow ? "translateX(-50%)" : "translate(-50%, -100%)",
      }}
    >
      {tooltip.text}
    </div>
  );
}
