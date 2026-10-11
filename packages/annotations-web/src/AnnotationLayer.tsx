import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { AnnotationPluginRegistry, OverlayComposer, defaultOverlayTheme } from "@video-player-ui/annotations";
import type { OverlayHit, OverlayLayer } from "@video-player-ui/annotations";
import { FrameCanvas, Icon, IconButton, IconName, PlayerControlSlot, usePlayerContext, usePlayerShortcut } from "@video-player-ui/web";
import type { FrameCanvasHandle, FrameDrawContext, FramePointer, PlayerContextValue } from "@video-player-ui/web";

import type { AnnotationLayerLabels } from "./AnnotationLayerLabels.js";
import type { AnnotationLayerProps } from "./AnnotationLayerProps.js";
import { defaultAnnotationLayerLabels } from "./defaultAnnotationLayerLabels.js";

const NO_LAYERS: readonly OverlayLayer[] = [];

/**
 * Draws annotation layers over a {@link VideoPlayer} in step with the frame
 * on screen, with hover highlight, click selection, a show/hide button in the
 * control bar and a toggle key.
 *
 * @param props - Layers, plugins, theme and callbacks.
 * @returns The layer, rendered as a child of `VideoPlayer`.
 */
export function AnnotationLayer(props: AnnotationLayerProps): ReactElement {
  const { layers, onAnnotationClick, onAnnotationHover }: AnnotationLayerProps = props;
  const { showFeedback }: PlayerContextValue = usePlayerContext();
  const canvasRef: { current: FrameCanvasHandle | null } = useRef<FrameCanvasHandle | null>(null);
  const hoveredRef: { current: OverlayHit | null } = useRef<OverlayHit | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(props.isInitiallyVisible ?? true);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const labels: AnnotationLayerLabels = { ...defaultAnnotationLayerLabels, ...props.labels };
  const visibleLayers: readonly OverlayLayer[] = isVisible ? layers : NO_LAYERS;

  const composer: OverlayComposer = useMemo(
    (): OverlayComposer =>
      new OverlayComposer(props.plugins ?? AnnotationPluginRegistry.withBuiltins(), props.theme ?? defaultOverlayTheme),
    [props.plugins, props.theme],
  );

  const draw: (context: FrameDrawContext) => void = useCallback(
    ({ surface, transform, frame }: FrameDrawContext): void => {
      const hovered: OverlayHit | null = hoveredRef.current;
      composer.render({
        surface,
        transform,
        timeId: frame.timeId,
        layers: visibleLayers,
        isHighlighted: (hit: OverlayHit): boolean =>
          hovered !== null && hit.layerId === hovered.layerId && hit.annotation === hovered.annotation,
      });
    },
    [composer, visibleLayers],
  );

  useEffect(() => {
    const unsubscribes: (() => void)[] = layers.map((layer: OverlayLayer) => layer.source.subscribe(() => canvasRef.current?.redraw()));
    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  }, [layers]);

  const toggle: () => void = (): void => {
    showFeedback(<Icon name={isVisible ? IconName.TAG_HIDDEN : IconName.TAG} size={32} />);
    setIsVisible(!isVisible);
  };
  usePlayerShortcut(props.toggleKey === undefined ? "a" : props.toggleKey, toggle);

  const hitAt: (pointer: FramePointer) => OverlayHit | null = (pointer: FramePointer): OverlayHit | null =>
    composer.hitTest(pointer.transform, pointer.frame.timeId, visibleLayers, pointer.viewPoint)[0] ?? null;

  const setHovered: (hit: OverlayHit | null) => void = (hit: OverlayHit | null): void => {
    const previous: OverlayHit | null = hoveredRef.current;
    if (hit?.annotation === previous?.annotation && hit?.layerId === previous?.layerId) {
      return;
    }
    hoveredRef.current = hit;
    setIsHovering(hit !== null);
    onAnnotationHover?.(hit);
    canvasRef.current?.redraw();
  };

  const isInteractive: boolean = onAnnotationClick !== undefined || onAnnotationHover !== undefined;

  return (
    <>
      <FrameCanvas
        ref={canvasRef}
        draw={draw}
        {...(isInteractive
          ? {
              onPointerMove: (pointer: FramePointer): void => setHovered(hitAt(pointer)),
              onPointerLeave: (): void => setHovered(null),
              onClick: (pointer: FramePointer): boolean => {
                const hit: OverlayHit | null = hitAt(pointer);
                if (hit === null || onAnnotationClick === undefined) {
                  return false;
                }
                onAnnotationClick(hit);
                return true;
              },
            }
          : {})}
        {...(isHovering ? { cursor: "pointer" } : {})}
      />
      {props.isToggleVisible !== false && layers.length > 0 && (
        <PlayerControlSlot>
          <IconButton label={isVisible ? labels.hide : labels.show} isPressed={isVisible} onClick={toggle}>
            <Icon name={isVisible ? IconName.TAG : IconName.TAG_HIDDEN} size={22} />
          </IconButton>
        </PlayerControlSlot>
      )}
    </>
  );
}
