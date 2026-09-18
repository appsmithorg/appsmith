import packageJson from "../package.json";

// Build identity surfaced by /health and get_capabilities so operators can tell WHICH build an instance is running
// (twice in one week a diagnosis stalled on exactly that question). Read ONCE at startup: the package.json version
// (a compile-time JSON import — no exec calls, no fs reads), plus an optional deploy-stamped build time
// (APPSMITH_MCP_BUILD_TIME, passed through verbatim when set).
export const MCP_BUILD_INFO: { version: string; buildTime?: string } = {
  version: packageJson.version,
  ...(process.env.APPSMITH_MCP_BUILD_TIME
    ? { buildTime: process.env.APPSMITH_MCP_BUILD_TIME }
    : {}),
};
