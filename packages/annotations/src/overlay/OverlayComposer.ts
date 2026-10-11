import type { Annotation, AnnotationKindName } from "../annotation/AnnotationTypeMap.js";
import type { Point } from "@video-player-ui/core";
import type { ViewportTransform } from "@video-player-ui/core";
import type { AnnotationPlugin } from "../plugin/AnnotationPlugin.js";
import { AnnotationPluginRegistry } from "../plugin/AnnotationPluginRegistry.js";
import { defaultOverlayTheme } from "./defaultOverlayTheme.js";
import { LabelPainter } from "./LabelPainter.js";
import type { OverlayHit } from "./OverlayHit.js";
import type { OverlayLayer } from "./OverlayLayer.js";
import type { OverlayRenderRequest } from "./OverlayRenderRequest.js";
import type { OverlayTheme } from "./OverlayTheme.js";

/**
 * Draws and hit tests the annotation layers of a frame through the plugins
 * of their kinds. Annotations held from an earlier frame are drawn faded, so
 * they are not mistaken for results of the frame on screen.
 */
export class OverlayComposer {
  private readonly registry: AnnotationPluginRegistry;
  private readonly theme: OverlayTheme;
  private readonly labelPainter: LabelPainter = new LabelPainter();

  /**
   * Bind the composer to its plugins and base theme.
   *
   * @param registry - Plugins by kind; defaults to the built-in kinds.
   * @param theme - Theme of layers without overrides.
   */
  constructor(registry: AnnotationPluginRegistry = AnnotationPluginRegistry.withBuiltins(), theme: OverlayTheme = defaultOverlayTheme) {
    this.registry = registry;
    this.theme = theme;
  }

  /**
   * Clear the surface and draw every visible layer of a frame.
   *
   * @param request - Surface, transform, frame and layers to draw.
   * @throws RangeError When an annotation's kind has no plugin.
   */
  render(request: OverlayRenderRequest): void {
    const { surface, transform, timeId, layers } = request;
    surface.clear();
    if (timeId === null) {
      return;
    }
    for (const layer of layers) {
      if (layer.isVisible === false) {
        continue;
      }
      const theme: OverlayTheme = this.themeOf(layer);
      const isHeld: boolean = layer.source.sourceTimeIdAt(timeId) !== timeId;
      surface.save();
      surface.multiplyOpacity((layer.opacity ?? 1) * (isHeld ? theme.heldOpacity : 1));
      for (const annotation of OverlayComposer.visibleAnnotations(layer, timeId)) {
        this.registry.get(annotation.kind).render(annotation, {
          surface,
          transform,
          theme,
          color: theme.palette.colorFor(annotation),
          isHighlighted: request.isHighlighted?.({ layerId: layer.id, annotation }) ?? false,
          labelPainter: this.labelPainter,
        });
      }
      surface.restore();
    }
  }

  /**
   * Annotations under a view point, topmost first.
   *
   * @param transform - Mapping from normalized frame coordinates to the view.
   * @param timeId - Time id of the frame on screen.
   * @param layers - Layers drawn bottom to top.
   * @param point - Point in view coordinates.
   * @returns The hit annotations of visible layers whose plugins support hit testing.
   */
  hitTest(transform: ViewportTransform, timeId: number, layers: readonly OverlayLayer[], point: Point): readonly OverlayHit[] {
    const hits: OverlayHit[] = [];
    for (const layer of [...layers].reverse()) {
      if (layer.isVisible === false) {
        continue;
      }
      for (const annotation of [...OverlayComposer.visibleAnnotations(layer, timeId)].reverse()) {
        const plugin: AnnotationPlugin<AnnotationKindName> = this.registry.get(annotation.kind);
        if (plugin.containsPoint?.(annotation, point, transform) === true) {
          hits.push({ layerId: layer.id, annotation });
        }
      }
    }
    return hits;
  }

  private themeOf(layer: OverlayLayer): OverlayTheme {
    return layer.theme === undefined ? this.theme : { ...this.theme, ...layer.theme };
  }

  private static visibleAnnotations(layer: OverlayLayer, timeId: number): readonly Annotation[] {
    const annotations: readonly Annotation[] = layer.source.annotationsAt(timeId);
    return layer.filter === undefined ? annotations : annotations.filter(layer.filter);
  }
}
