import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { ViewportTransform } from "@video-player-ui/core";
import type { MediaInfo, Point, PresentedFrame } from "@video-player-ui/core";

import { CanvasDrawingSurface } from "../surface/CanvasDrawingSurface.js";
import type { FrameCanvasHandle } from "./FrameCanvasHandle.js";
import type { FrameCanvasProps } from "./FrameCanvasProps.js";
import type { FramePointer } from "./FramePointer.js";
import type { PlayerContextValue } from "./PlayerContextValue.js";
import { usePlayerContext } from "./usePlayerContext.js";

/**
 * Canvas over the video that redraws once per frame on screen, for any
 * frame-synchronized drawing: annotations, subtitles, heat maps, guides.
 *
 * Drawing runs outside React rendering, so it never lags the video by a
 * render cycle. Place it among the children of a {@link VideoPlayer}.
 *
 * @param props - Draw callback, pointer callbacks and handle ref.
 * @returns The canvas element.
 */
export function FrameCanvas(props: FrameCanvasProps): ReactElement {
  const { draw, ref, onPointerMove, onPointerLeave, onClick, cursor, className }: FrameCanvasProps = props;
  const { controller, contentFit }: PlayerContextValue = usePlayerContext();
  const canvasRef: { current: HTMLCanvasElement | null } = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef: { current: CanvasDrawingSurface | null } = useRef<CanvasDrawingSurface | null>(null);
  const frameRef: { current: PresentedFrame | null } = useRef<PresentedFrame | null>(null);
  const drawRef: { current: FrameCanvasProps["draw"] } = useRef<FrameCanvasProps["draw"]>(draw);
  drawRef.current = draw;
  const isInteractive: boolean = onPointerMove !== undefined || onPointerLeave !== undefined || onClick !== undefined;

  const transformOf: () => ViewportTransform | null = useCallback((): ViewportTransform | null => {
    const surface: CanvasDrawingSurface | null = surfaceRef.current;
    const mediaInfo: MediaInfo | null = controller.getSnapshot().mediaInfo;
    if (surface === null || mediaInfo === null || surface.size.width <= 0 || surface.size.height <= 0) {
      return null;
    }
    return new ViewportTransform(mediaInfo.frameSize, surface.size, contentFit);
  }, [controller, contentFit]);

  const redraw: () => void = useCallback((): void => {
    const surface: CanvasDrawingSurface | null = surfaceRef.current;
    if (surface === null) {
      return;
    }
    surface.clear();
    const transform: ViewportTransform | null = transformOf();
    const frame: PresentedFrame | null = frameRef.current;
    if (transform !== null && frame !== null) {
      drawRef.current({ surface, transform, frame });
    }
  }, [transformOf]);

  useImperativeHandle(ref, (): FrameCanvasHandle => ({ redraw }), [redraw]);

  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (canvas === null) {
      return undefined;
    }
    const surface: CanvasDrawingSurface = new CanvasDrawingSurface(canvas);
    surfaceRef.current = surface;
    const observer: ResizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const entry: ResizeObserverEntry | undefined = entries[0];
      if (entry !== undefined) {
        surface.resize({ width: entry.contentRect.width, height: entry.contentRect.height }, window.devicePixelRatio || 1);
        redraw();
      }
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      surfaceRef.current = null;
    };
  }, [redraw]);

  useEffect(
    () =>
      controller.subscribeFrame((frame: PresentedFrame) => {
        frameRef.current = frame;
        redraw();
      }),
    [controller, redraw],
  );

  useEffect(() => {
    redraw();
  }, [draw, redraw]);

  const pointerOf: (event: ReactMouseEvent<HTMLCanvasElement>) => FramePointer | null = (
    event: ReactMouseEvent<HTMLCanvasElement>,
  ): FramePointer | null => {
    const transform: ViewportTransform | null = transformOf();
    const frame: PresentedFrame | null = frameRef.current;
    if (transform === null || frame === null) {
      return null;
    }
    const bounds: DOMRect = event.currentTarget.getBoundingClientRect();
    const viewPoint: Point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    return { viewPoint, framePoint: transform.toNormalized(viewPoint), transform, frame };
  };

  const handlePointerMove: (event: ReactMouseEvent<HTMLCanvasElement>) => void = (event: ReactMouseEvent<HTMLCanvasElement>): void => {
    const pointer: FramePointer | null = pointerOf(event);
    if (pointer !== null) {
      onPointerMove?.(pointer);
    }
  };

  const handleClick: (event: ReactMouseEvent<HTMLCanvasElement>) => void = (event: ReactMouseEvent<HTMLCanvasElement>): void => {
    const pointer: FramePointer | null = pointerOf(event);
    if (pointer !== null && onClick?.(pointer) === true) {
      event.stopPropagation();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={className === undefined ? "vpui-frame-canvas" : `vpui-frame-canvas ${className}`}
      style={cursor === undefined ? undefined : { cursor }}
      data-interactive={isInteractive}
      data-vpui-surface="true"
      onPointerMove={onPointerMove === undefined ? undefined : handlePointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick === undefined ? undefined : handleClick}
    />
  );
}
