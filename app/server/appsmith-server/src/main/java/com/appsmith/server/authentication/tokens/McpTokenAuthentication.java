package com.appsmith.server.authentication.tokens;

import org.springframework.security.authentication.AbstractAuthenticationToken;

public class McpTokenAuthentication extends AbstractAuthenticationToken {

    private final String token;

    public McpTokenAuthentication(String token) {
        super(null);
        this.token = token;
        setAuthenticated(false);
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
