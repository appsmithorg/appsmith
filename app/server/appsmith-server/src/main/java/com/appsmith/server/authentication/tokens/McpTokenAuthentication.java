package com.appsmith.server.authentication.tokens;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

public class McpTokenAuthentication extends AbstractAuthenticationToken {

    // Marker authority stamped on the authenticated principal so downstream code can tell an MCP-token-authenticated
    // request from a normal session (used to forbid an MCP token from minting more MCP tokens).
    public static final String MCP_AUTHORITY = "MCP_TOKEN";

    /**
     * True when {@code authentication} is an authenticated principal carrying {@link #MCP_AUTHORITY} — i.e. the request
     * was authenticated via an {@code mcp_} bearer token rather than a normal session. Shared by the token-management
     * controller (to keep an MCP principal from managing tokens) and {@code McpAllowlistWebFilter} (to confine an MCP
     * principal to the tool allowlist) so the check lives in one place and cannot drift between the two.
     */
    public static boolean isMcpPrincipal(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (MCP_AUTHORITY.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

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
