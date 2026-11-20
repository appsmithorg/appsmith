import type { AppsmithApi, ToolResult } from "../../app.js";
import type { UpdateActionKind } from "../../builder/actionPatch.js";

// Edition extension point for action containers: places other than an application that hold actions (EE: workflows).
// With a container, list_actions, get_action, update_action and duplicate_action accept the container's id field
// (such as workflowId) in place of applicationId.
//
// Core imports this module through ee/extensions/actionContainers.ts, which CE ships as a re-export of this file and
// EE replaces. CE has no containers, so every action tool keeps its application-only schema and behaviour.
//
// Import-order rule: app.ts imports this module, so take only type imports from app.ts here (see ce/extensions/tools.ts).
//
// Contract for an edition that overrides this module:
//  - idField is unique across containers, is a plain identifier, and is never "applicationId".
//  - Every hook calls Appsmith through the `api` it is handed (the caller's token and the internal marker), so the
//    server's ACLs decide what the caller can read or change. Never return actions the caller could not list.
//  - prepareSpec and placeAction must be pure apart from their arguments. prepareSpec runs before governance takes
//    its lock. placeAction runs before the lock for update_action and inside the lock for duplicate_action.
//  - A hook may throw. A throw from prepareSpec or placeAction, or from listActions while update_action or
//    duplicate_action reads the action, is reported to the agent as a compile error. Any other throw becomes a tool
//    error. Either way the agent sees the message, so a thrown message must never carry a secret.

export interface ActionContainer {
  // The id field the action tools accept for this container, such as "workflowId".
  idField: string;
  // A short name for descriptions and errors, such as "workflow".
  noun: string;
  // The container's actions as the server returns them (an array of ActionDTOs), or an error the caller may see.
  listActions: (api: AppsmithApi, id: string) => Promise<unknown>;
  // The workspace the container belongs to, for the datasource and plugin checks. Undefined when the caller cannot
  // read it.
  workspaceId: (api: AppsmithApi, id: string) => Promise<string | undefined>;
  // Rewrites an update's structured configuration (the `query`, `rest` or `email` object) into the core vocabulary
  // before it is validated. `kind` is the update kind (SQL, REST or SMTP). It must set applicationId and pageId,
  // which the core compilers require. The container id is the usual stand-in.
  // Return { ok: false, error } to refuse the spec. The error is shown to the agent.
  prepareSpec: (
    source: Record<string, unknown>,
    id: string,
    kind: UpdateActionKind,
  ) =>
    | { ok: true; source: Record<string, unknown> }
    | { ok: false; error: string };
  // Places a compiled or cloned action DTO in the container (for example, sets the container id and removes the
  // page). Called on update_action's patch and on duplicate_action's copy. `kind` is the spec's kind.
  placeAction: (
    action: Record<string, unknown>,
    id: string,
    kind: UpdateActionKind,
  ) => Record<string, unknown>;
  // The governance lock and audit key for an update or duplicate of an action in this container. Optional: the
  // default is `action:<actionId>`, the key application actions use.
  entityKey?: (id: string, actionId: string) => string;
  // Whether the container's actions can run on page load. Optional, default true. When false, update_action and
  // duplicate_action skip the Manual run-behaviour pin they apply to an email (SMTP) query, because there is no page.
  hasPageLoad?: boolean;
  // The git branch gate for a write. Optional: without it, a write that names a branch is refused, because the core
  // gate checks applications only.
  branchGate?: (
    api: AppsmithApi,
    id: string,
    branch: string | undefined,
  ) => Promise<{ ok: true } | { ok: false; result: ToolResult }>;
}

export const ACTION_CONTAINERS: readonly ActionContainer[] = [];
