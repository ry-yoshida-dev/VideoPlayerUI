import type { AnnotationKindName } from "../annotation/AnnotationTypeMap.js";
import type { AnnotationPlugin } from "./AnnotationPlugin.js";
import { BoundingBoxPlugin } from "./builtin/BoundingBoxPlugin.js";
import { KeypointsPlugin } from "./builtin/KeypointsPlugin.js";
import { PolygonPlugin } from "./builtin/PolygonPlugin.js";

/**
 * Plugins by annotation kind, consulted when parsing, drawing and hit testing.
 */
export class AnnotationPluginRegistry {
  private readonly plugins: Map<string, AnnotationPlugin<AnnotationKindName>> = new Map();

  /**
   * Registry holding the plugins of every built-in kind.
   *
   * @returns A new registry.
   */
  static withBuiltins(): AnnotationPluginRegistry {
    return new AnnotationPluginRegistry().register(new BoundingBoxPlugin()).register(new PolygonPlugin()).register(new KeypointsPlugin());
  }

  /**
   * Add a plugin, replacing any plugin of the same kind.
   *
   * @param plugin - Plugin to add.
   * @returns This registry, for chaining.
   */
  register<TKind extends AnnotationKindName>(plugin: AnnotationPlugin<TKind>): this {
    this.plugins.set(plugin.kind, plugin);
    return this;
  }

  /**
   * Whether a kind has a plugin.
   *
   * @param kind - Kind tag.
   * @returns True when registered.
   */
  has(kind: string): boolean {
    return this.plugins.has(kind);
  }

  /**
   * Plugin of a kind.
   *
   * @param kind - Kind tag.
   * @returns The plugin.
   * @throws RangeError When no plugin is registered for the kind.
   */
  get(kind: string): AnnotationPlugin<AnnotationKindName> {
    const plugin: AnnotationPlugin<AnnotationKindName> | undefined = this.plugins.get(kind);
    if (plugin === undefined) {
      throw new RangeError(`No annotation plugin registered for kind "${kind}"; registered kinds: ${[...this.plugins.keys()].join(", ")}`);
    }
    return plugin;
  }

  /**
   * Registered kind tags.
   *
   * @returns The kinds in registration order.
   */
  kinds(): readonly string[] {
    return [...this.plugins.keys()];
  }
}
