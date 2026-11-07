/**
 * Props of {@link TooltipLayer}.
 */
export interface TooltipLayerProps {
  /** Player root; elements inside it with `data-vpui-tooltip` get a tooltip. */
  readonly root: HTMLElement | null;
  /** Hover time before the first tooltip appears. */
  readonly delayMilliseconds?: number;
}
