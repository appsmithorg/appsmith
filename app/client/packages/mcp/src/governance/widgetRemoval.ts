import { createHash } from "node:crypto";
import { canonicalStableSerialize } from "../builder/semantic.js";
import type { DestructiveConfirmationBinding } from "./coordinator.js";
import { pageEntityKey } from "./entityKeys.js";

// The shared approval seam for removing widgets (APP-16324 F7). Removal is destructive, so it goes through the same
// prepare/confirm flow as delete_page. The core tools (prepare_remove_widgets / confirm_remove_widgets) use it, and
// an edition tool that removes page content can use the same binding with its own operation name, so every widget
// removal is approved the same way.
//
// The binding ties a one-time confirmation to:
// - the actor who prepared it;
// - the page's lock entity, the same one commitLayout uses for every layout write;
// - the operation name, so a token prepared by one tool cannot confirm another;
// - the page's revision when the removal was prepared, so a changed page cannot be confirmed;
// - a digest of the exact target: application, page, layout and the removed names, sorted and deduplicated.

export const WIDGET_REMOVAL_OPERATION = "remove_widgets";

// The most widgets one approval can name. Each name may take a container with all its content.
export const WIDGET_REMOVAL_MAX = 20;

export interface WidgetRemovalTarget {
  applicationId: string;
  pageId: string;
  layoutId: string;
  names: readonly string[];
}

// The lock and audit entity of the page a removal changes.
export function widgetRemovalEntityKey(
  applicationId: string,
  pageId: string,
): string {
  return pageEntityKey(applicationId, pageId);
}

// The target's names in one canonical order, so the same removal always yields the same digest.
export function canonicalRemovalNames(names: readonly string[]): string[] {
  return [...new Set(names)].sort();
}

export function widgetRemovalDigest(target: WidgetRemovalTarget): string {
  return createHash("sha256")
    .update(
      canonicalStableSerialize({
        applicationId: target.applicationId,
        pageId: target.pageId,
        layoutId: target.layoutId,
        names: canonicalRemovalNames(target.names),
      }),
      "utf8",
    )
    .digest("hex");
}

// The confirmation binding for prepareDestructiveConfirmation and consumeDestructiveConfirmation. Both sides build it
// from the same inputs, so a token confirms only the removal it was prepared for, by the same actor and tool, on the
// same page revision. A tool other than the core pair passes its own `operation`.
export function widgetRemovalBinding(
  actorId: string,
  target: WidgetRemovalTarget,
  revision: string,
  operation: string = WIDGET_REMOVAL_OPERATION,
): DestructiveConfirmationBinding {
  return {
    actorId,
    entityKey: widgetRemovalEntityKey(target.applicationId, target.pageId),
    operation,
    revision,
    digest: widgetRemovalDigest(target),
  };
}
