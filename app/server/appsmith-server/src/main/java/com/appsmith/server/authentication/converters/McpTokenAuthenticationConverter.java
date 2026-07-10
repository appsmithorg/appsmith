package com.appsmith.server.authentication.converters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class McpTokenAuthenticationConverter implements ServerAuthenticationConverter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String MCP_TOKEN_PREFIX = "mcp_";

    @Override
    public Mono<Authentication> convert(ServerWebExchange exchange) {
        String authorization = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            return Mono.empty();
        }

        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        return token.startsWith(MCP_TOKEN_PREFIX) ? Mono.just(new McpTokenAuthentication(token)) : Mono.empty();
    }
}
