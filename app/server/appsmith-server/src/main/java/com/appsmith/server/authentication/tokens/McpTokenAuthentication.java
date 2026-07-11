package com.appsmith.server.authentication.tokens;

import org.springframework.security.authentication.AbstractAuthenticationToken;

public class McpTokenAuthentication extends AbstractAuthenticationToken {

    // Marker authority stamped on the authenticated principal so downstream code can tell an MCP-token-authenticated
    // request from a normal session (used to forbid an MCP token from minting more MCP tokens).
    public static final String MCP_AUTHORITY = "MCP_TOKEN";

    private final String token;
    private final String clientAddress;

    public McpTokenAuthentication(String token) {
        this(token, "unknown");
    }

    public McpTokenAuthentication(String token, String clientAddress) {
        super(null);
        this.token = token;
        this.clientAddress = clientAddress;
        setAuthenticated(false);
    }

    public String getClientAddress() {
        return clientAddress;
    }

    @Override
    public Object getCredentials() {
        return token;
    }

    @Override
    public Object getPrincipal() {
        return null;
    }
}
