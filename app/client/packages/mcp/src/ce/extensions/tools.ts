import type {
  RegisteredTool,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z, ZodRawShape } from "zod";
import type { AppsmithApi, ServerContext, ToolResult } from "../../app.js";
import type { CapabilityGates } from "../../builder/capabilities.js";

// Edition extension point for registering MCP tools (EE: workflows). The data describing those tools — catalog
// entries, annotations, gate requirements, guides — lives in ce/extensions/catalog.ts; this module is the runtime half.
//
// Core imports this module through ee/extensions/tools.ts, which CE ships as a re-export of this file and EE replaces
// with its own implementation. CE ships no extension tools, so everything here is a no-op.
//
// Import-order rule for an edition that overrides this module: app.ts imports it, so any RUNTIME import it takes from
// app.ts (or from a module that imports app.ts) is a cycle and must only be used inside functions, never at module
// top level, where the binding is still uninitialised. Type-only imports are free. (The cycle-free path is
// app.ts -> toolAnnotations.ts -> ee/extensions/catalog.ts, which is why the data lives there.)
//
// Contract for an edition that overrides this module:
//  - registerExtensionTools: called once per session from buildMcpServer, after the core tools. Register through
//    host.registerTool only (never server.tool), which enforces, per call:
//      * the name is in EXTENSION_TOOL_CATALOG (otherwise it throws);
//      * the tool is NOT destructive — no destructiveHint: true, and not a non-read-only tool that leaves
//        destructiveHint unset (MCP's default is destructive). A destructive operation registers through
//        host.registerGovernedOperation instead (below). It throws, whatever the session's gates;
//      * the catalog gate is active under host.gates — if not, the registration is SKIPPED and returns undefined, so
//        an edition registers every tool unconditionally and the gating is automatic (and matches get_capabilities);
//      * the tool's annotations come from TOOL_ANNOTATIONS (it throws without an entry); never pass annotations
//        yourself — an annotations-like object before the callback is refused.
//  - host.registerGovernedOperation: the only way to register a destructive extension operation (APP-16324 F7b). It
//    registers a prepare tool and a confirm tool, and the host runs the whole approval flow, the same one the core
//    prepare/confirm tools use. The edition supplies only what is specific to its operation (see GovernedOperation).
//    Catalog both tools with governed: true, under any gate, such as an "extension:<name>" licence gate. It throws
//    when:
//      * either name is not in EXTENSION_TOOL_CATALOG, or is not catalogued with governed: true;
//      * the prepare tool is annotated destructive, or the confirm tool is not annotated destructiveHint: true or is
//        read-only.
//    It registers nothing and returns undefined unless governance is configured and both catalog gates are on, which
//    is also what get_capabilities reports. host.registerTool refuses a tool catalogued with governed: true.
//  - resolveExtensionGates: decides the session's "extension:<name>" gates (see EXTENSION_GATE_REQUIREMENTS), as
//    { <name>: true } for each gate that is on. createMcpHttpServer calls it LIVE with the caller's API client every
//    time it builds a session's server (initialize, and rehydration on another replica) — the result is never stored
//    in the shared session record. A gate missing from the result, or a resolver that throws, is OFF (fail closed).

// The host's registrar: the SDK's description-bearing tool() overloads minus the annotation-bearing ones (annotations
// come from TOOL_ANNOTATIONS), returning undefined when the tool's gate is off.
export interface ExtensionToolRegistrar {
  (
    name: string,
    description: string,
    cb: ToolCallback,
  ): RegisteredTool | undefined;
  <Args extends ZodRawShape>(
    name: string,
    description: string,
    paramsSchema: Args,
    cb: ToolCallback<Args>,
  ): RegisteredTool | undefined;
}

// What a governed operation will change. The host binds the one-time confirmation to these values, plus the actor,
// the confirm tool's name and the whole validated spec, so a token confirms only the change it was prepared for.
export interface GovernedTarget {
  // The application the operation changes. Confirm runs the git branch gate on it.
  applicationId: string;
  // The lock and audit entity, such as pageEntityKey(applicationId, pageId) for a page layout.
  entityKey: string;
  // The entity's revision as the operation was planned.
  revision: string;
  // A digest of the exact target, such as widgetRemovalDigest for a widget removal.
  digest: string;
}

export type GovernedPlan =
  | {
      ok: true;
      target: GovernedTarget;
      // Returned to the agent by prepare, such as the widgets that will go.
      summary: unknown;
      // The approval prompt shown to the user, also used in prepare's relay text. Pass every interpolated value
      // through promptSafe (prompt/hygiene.ts), and never claim more than the digest binds. Say "This cannot be undone
      // via MCP." when that is true. The host appends its standard consent sentence, so do not write one. It also
      // strips control and bidi characters and cuts the prompt at 1,000 characters.
      prompt: string;
    }
  | { ok: false; result: ToolResult };

// What execute receives besides the spec.
export interface GovernedExecution {
  // The confirm call's branch, already checked by the git branch gate.
  branch: string | undefined;
  // The target the user approved, from the confirm-time plan.
  target: GovernedTarget;
  // The git gate's warning for a git-connected application, to return with the result.
  gitWarning: string | undefined;
}

// The two tools the host registers:
//  - prepare takes { spec }. It returns { confirmationId, expiresAt, operation, summary, relay }, or the plan's
//    refusal, or a validation error.
//  - confirm takes { spec, confirmationId, branch? } with the same spec. It returns execute's result, or one of these
//    codes: confirmation_invalid (missing, expired, used or another actor's), confirmation_mismatch (prepared for
//    another change), revision_conflict (the target changed since prepare), git_branch_required, git_branch_changed,
//    the operation's notConfirmedCode (the user declined), or operation_failed (execute threw after the token was
//    spent; prepare again to retry).
// Describe these in prepareDescription and confirmDescription: they are the agent's only documentation.
export interface GovernedOperation<Spec> {
  prepareTool: string;
  prepareDescription: string;
  confirmTool: string;
  confirmDescription: string;
  // Validates the `spec` argument both tools take.
  spec: z.ZodType<Spec, z.ZodTypeDef, unknown>;
  // Reads the current state and plans the change, or refuses it. The host calls it on prepare, and again on confirm
  // before it spends the token. A plan whose target differs from the prepared one is refused, so a changed page
  // cannot be confirmed. It must not write anything. Run any licence or entitlement check here too.
  plan: (spec: Spec) => Promise<GovernedPlan>;
  // Makes the change. The host calls it only after the user approved and the token was spent. Write through
  // host.ctx.governance.execute with entityKey: target.entityKey, expectedRevision: target.revision and the caller's
  // organizationId. Then a target that changed while the user was answering the prompt is refused, and the change is
  // locked and recorded. Never use a revision read inside execute as the expected revision.
  execute: (spec: Spec, context: GovernedExecution) => Promise<ToolResult>;
  // The approval prompt's title and the description of its yes or no field.
  approvalTitle: string;
  approvalDescription: string;
  // Used in refusal sentences, such as "the user DECLINED the approval prompt for this <operationNoun>" and
  // "... was refused and <nothingHappened>". For example: "row removal" and "nothing was removed".
  operationNoun: string;
  nothingHappened: string;
  // The `code` returned when the user declines or cancels the prompt, such as "remove_rows_not_confirmed".
  notConfirmedCode: string;
}

export interface ExtensionToolHost {
  // The enforcing registrar described above, built by buildMcpServer for this session.
  registerTool: ExtensionToolRegistrar;
  // Registers a governed prepare and confirm pair, described above. Returns the two tools, or undefined when
  // governance or either catalog gate is off.
  registerGovernedOperation: <Spec>(
    operation: GovernedOperation<Spec>,
  ) => { prepare: RegisteredTool; confirm: RegisteredTool } | undefined;
  api: AppsmithApi;
  ctx: ServerContext;
  // This session's gates, including the resolved extension gates.
  gates: CapabilityGates;
  // The standard JSON text result every core tool returns.
  result: (data: unknown) => ToolResult;
}

// Typed as a constant so the CE no-op can ignore its argument while EE's implementation receives it.
export const registerExtensionTools: (host: ExtensionToolHost) => void = () =>
  undefined;

// CE has no extension gates, so it never calls the server.
export const resolveExtensionGates: (
  api: AppsmithApi,
) => Promise<Readonly<Record<string, boolean>>> = async () => ({});
