import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { ToolCatalogEntry } from "../../builder/capabilities.js";
import type { InstructionDoc } from "../../builder/instructions.js";

// Edition extension point for the DATA that describes extension tools (EE: workflows): their catalog entries,
// annotations, gate requirements, guides and server-instruction text.
//
// Core imports this module through ee/extensions/catalog.ts, which CE ships as a re-export of this file and EE
// replaces with its own. It is data only, kept apart from the runtime registration in ce/extensions/tools.ts, because
// builder/capabilities.ts, toolAnnotations.ts and builder/instructions.ts read it at module load: an edition's
// tools.ts imports app.ts at runtime, and app.ts imports those three, so reading the data from tools.ts would be an
// import cycle that leaves these lists undefined at load. This file (and EE's replacement) must therefore have NO
// runtime imports — `import type` only.
//
// Contract for an edition that overrides this module — every list is checked against core at module load, so drift
// fails loudly:
//  - EXTENSION_TOOL_CATALOG: one entry per extension tool, merged into TOOL_CATALOG (get_capabilities' tool list and
//    disabledCapabilities). A name that collides with a core tool is refused. The gate is a core gate ("always",
//    "data", ...) or an edition gate "extension:<name>" (see EXTENSION_GATE_REQUIREMENTS).
//  - EXTENSION_TOOL_ANNOTATIONS: the MCP annotations for every extension tool, merged into TOOL_ANNOTATIONS. A key
//    that collides with a core tool is refused, so an extension can never relabel a core tool (e.g. mark a
//    destructive tool read-only). Registration refuses a tool without an entry.
//  - EXTENSION_GATE_REQUIREMENTS: for every "extension:<name>" gate used in EXTENSION_TOOL_CATALOG, keyed by <name>,
//    what enables it (a human-facing instruction) and what it unlocks — get_capabilities' disabledCapabilities shows
//    it while the gate is off. A used gate without an entry is refused. Whether the gate is on is decided per
//    session by resolveExtensionGates (ce/extensions/tools.ts).
//  - EXTENSION_GUIDES: extra get_guide / appsmith://guide/<slug> documents. A slug that collides with any core doc
//    (guide, recipe or the widget reference) is refused.
//  - EXTENSION_SERVER_INSTRUCTIONS: text appended to the MCP initialize instructions (empty = core text unchanged).
//    Any snake_case tool name it mentions must be in TOOL_CATALOG (guarded by the instructions test).

export const EXTENSION_TOOL_CATALOG: readonly ToolCatalogEntry[] = [];

export const EXTENSION_TOOL_ANNOTATIONS: Readonly<
  Record<string, ToolAnnotations>
> = {};

export const EXTENSION_GATE_REQUIREMENTS: Readonly<
  Record<string, { requires: string; provides: string }>
> = {};

export const EXTENSION_GUIDES: readonly InstructionDoc[] = [];

export const EXTENSION_SERVER_INSTRUCTIONS = "";
