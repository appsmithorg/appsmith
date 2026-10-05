import type { CapabilityGates } from "../../builder/capabilities.js";

// Edition extension point for get_capabilities: top-level sections describing what the edition adds (or, in CE, what
// is absent so an agent can tell the user instead of guessing).
//
// Core imports this module through ee/extensions/capabilities.ts, which CE ships as a re-export of this file and EE
// replaces with its own implementation. Section keys must not collide with core keys; getCapabilities refuses a
// collision rather than letting an extension overwrite a core section.
//
// CE has no workflow tools. The section stays so an agent asked to build a workflow reports that this server cannot,
// rather than trying to approximate one with app tools.
export const extensionCapabilities: (
  gates: CapabilityGates,
) => Record<string, unknown> = () => ({
  workflows: {
    available: false,
    note: "This MCP server has no workflow tools on this edition, so it cannot create or edit Appsmith workflows.",
  },
});
