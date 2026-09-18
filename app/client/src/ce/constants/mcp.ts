/**
 * Default MCP endpoint advertised to clients. The /mcp route is served from the app origin (via Caddy).
 */
export const getDefaultMcpServerUrl = (): string =>
  `${window.location.origin}/mcp`;
