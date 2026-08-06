package com.appsmith.server.constants.ce;

/**
 * Header names for the internal MCP -> /api/v1 trust boundary. Shared (CE) so both the CE and EE security wiring
 * reference the identical constant.
 */
public class McpHeaders {

    private McpHeaders() {}

    /**
     * The internal marker the loopback MCP Node service stamps on every /api/v1 request it makes on behalf of an
     * mcp_ token. Its value must constant-time-equal APPSMITH_MCP_INTERNAL_SECRET for the mcp_ bearer to
     * authenticate. Caddy strips any inbound copy of this header on ingress, so an external client cannot forge it.
     */
    public static final String INTERNAL_MARKER = "X-Appsmith-Mcp-Internal";
}
