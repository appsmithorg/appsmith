package com.appsmith.server.helpers;

import net.minidev.json.JSONObject;

import java.util.Map;

/**
 * Output of {@link DslUtils#regenerateWidgetIds(JSONObject)}.
 *
 * <p>Widget ids in a page DSL are <strong>identifiers used as references</strong>: they are
 * referenced from inside the DSL itself (e.g. {@code parentId}, {@code mainCanvasId}) and from
 * sibling domain entities stored in other Mongo collections (e.g.
 * {@code ModuleInstance.widgetId}). Any operation that re-keys the DSL must therefore expose its
 * {@code oldId -> newId} mapping so cross-collection references can be translated to remain
 * resolvable.
 *
 * <p>Returning the mapping alongside the regenerated DSL — rather than just the DSL — makes that
 * cross-entity contract a property of the type system. A caller that only wires the DSL into
 * its destination and ignores {@link #oldToNewWidgetIds()} is now visibly dropping information
 * on the floor at the call site, rather than silently inheriting a broken invariant from a
 * helper whose signature did not advertise that information existed.
 *
 * <p>The {@code oldToNewWidgetIds} map is wrapped in an unmodifiable copy at construction time
 * so the regeneration result is safe to share between cloners without risking accidental
 * mutation. Callers that need to accumulate the mapping into a mutable collection (for example
 * the per-clone {@link com.appsmith.server.dtos.ClonePageMetaDTO}) should
 * {@code putAll} the result into their own map.
 */
public record WidgetIdRegenerationResult(JSONObject dsl, Map<String, String> oldToNewWidgetIds) {
    public WidgetIdRegenerationResult {
        // Defensive immutable copy: the regenerator builds the map with a mutable HashMap for
        // performance, but the result carrier should not let downstream code mutate it.
        oldToNewWidgetIds = Map.copyOf(oldToNewWidgetIds);
    }
}
