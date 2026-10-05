import type {
  RegisteredTool,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShape } from "zod";
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
//        destructiveHint unset (MCP's default is destructive). Extension tools get no governed prepare/confirm,
//        confirmation-token or elicitation layer yet, so a destructive extension tool must wait until CE widens this
//        host with one. It throws, whatever the session's gates;
//      * the catalog gate is active under host.gates — if not, the registration is SKIPPED and returns undefined, so
//        an edition registers every tool unconditionally and the gating is automatic (and matches get_capabilities);
//      * the tool's annotations come from TOOL_ANNOTATIONS (it throws without an entry); never pass annotations
//        yourself — an annotations-like object before the callback is refused.
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

export interface ExtensionToolHost {
  // The enforcing registrar described above, built by buildMcpServer for this session.
  registerTool: ExtensionToolRegistrar;
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
