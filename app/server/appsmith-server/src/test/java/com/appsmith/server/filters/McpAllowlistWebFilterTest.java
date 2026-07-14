package com.appsmith.server.filters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

class McpAllowlistWebFilterTest {

    private final McpAllowlistWebFilter filter = new McpAllowlistWebFilter();

    private static Authentication mcpPrincipal() {
        return new UsernamePasswordAuthenticationToken(
                "mcp-user", null, List.of(new SimpleGrantedAuthority(McpTokenAuthentication.MCP_AUTHORITY)));
    }

    private static Authentication ordinaryPrincipal() {
        return new UsernamePasswordAuthenticationToken(
                "session-user", null, List.of(new SimpleGrantedAuthority("USER")));
    }

    @Test
    void mcpPrincipal_allowlistedPath_passesThrough() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/v1/users/me"));
        assertPassesThrough(exchange, mcpPrincipal());
    }

    @Test
    void mcpPrincipal_allowlistedPathWithPathVariable_passesThrough() {
        MockServerWebExchange exchange =
                MockServerWebExchange.from(MockServerHttpRequest.get("/api/v1/applications/abc123"));
        assertPassesThrough(exchange, mcpPrincipal());
    }

    @Test
    void mcpPrincipal_nonAllowlistedPath_isForbidden() {
        // The token-mint endpoint is not on the allowlist -> 403 for an MCP principal (double-covered by the
        // controller-level block).
        MockServerWebExchange exchange =
                MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/users/mcp-tokens"));
        assertForbidden(exchange, mcpPrincipal());
    }

    @Test
    void mcpPrincipal_allowlistedPathWrongVerb_isForbidden() {
        // GET /api/v1/users/me is allowed, but DELETE on it is not.
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.delete("/api/v1/users/me"));
        assertForbidden(exchange, mcpPrincipal());
    }

    @Test
    void ordinaryPrincipal_nonAllowlistedPath_passesThrough() {
        // The allowlist only constrains MCP principals; a normal session user is untouched by this filter.
        MockServerWebExchange exchange =
                MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/users/mcp-tokens"));
        assertPassesThrough(exchange, ordinaryPrincipal());
    }

    private void assertPassesThrough(MockServerWebExchange exchange, Authentication authentication) {
        AtomicBoolean chainInvoked = new AtomicBoolean(false);
        WebFilterChain chain = ex -> {
            chainInvoked.set(true);
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)))
                .verifyComplete();

        assertThat(chainInvoked).isTrue();
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    private void assertForbidden(MockServerWebExchange exchange, Authentication authentication) {
        AtomicBoolean chainInvoked = new AtomicBoolean(false);
        WebFilterChain chain = ex -> {
            chainInvoked.set(true);
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)))
                .verifyComplete();

        assertThat(chainInvoked).isFalse();
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
