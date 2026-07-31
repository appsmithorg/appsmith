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
import java.util.concurrent.atomic.AtomicInteger;

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
    void mcpPrincipal_datasourceTrigger_passesThrough() {
        // Sheets discovery (get_datasource_structure) posts to the datasource trigger endpoint.
        MockServerWebExchange exchange =
                MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/datasources/abc123/trigger"));
        assertPassesThrough(exchange, mcpPrincipal());
    }

    @Test
    void mcpPrincipal_gitFlowRoutes_passThrough() {
        // The git tool flow: status, protected branches, branch list, create-ref, commit.
        assertPassesThrough(
                MockServerWebExchange.from(MockServerHttpRequest.get("/api/v1/git/applications/abc123/status")),
                mcpPrincipal());
        assertPassesThrough(
                MockServerWebExchange.from(
                        MockServerHttpRequest.get("/api/v1/git/applications/abc123/protected-branches")),
                mcpPrincipal());
        assertPassesThrough(
                MockServerWebExchange.from(MockServerHttpRequest.get("/api/v1/git/applications/abc123/refs")),
                mcpPrincipal());
        assertPassesThrough(
                MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/git/applications/abc123/create-ref")),
                mcpPrincipal());
        assertPassesThrough(
                MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/git/applications/abc123/commit")),
                mcpPrincipal());
    }

    @Test
    void mcpPrincipal_collectionUpdate_isPatchNotPut() {
        // The JS-object update is served as PATCH (PUT is not mapped on the controller); the allowlist must match
        // the Node client's verb, and the unserved PUT stays outside the cap.
        assertPassesThrough(
                MockServerWebExchange.from(MockServerHttpRequest.patch("/api/v1/collections/actions/abc123")),
                mcpPrincipal());
        assertForbidden(
                MockServerWebExchange.from(MockServerHttpRequest.put("/api/v1/collections/actions/abc123")),
                mcpPrincipal());
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

    @Test
    void mcpPrincipal_siblingRouteLiteralUnderAnIdWildcard_isDenied() {
        // PUT /api/v1/actions/{actionId} is meant to update ONE action by id, but a single-segment wildcard also
        // matches the sibling routes PUT /api/v1/actions/move and /refactor (both real ActionController mappings).
        // Those are not endpoints the MCP client calls, so leaving them reachable would silently widen the
        // allowlist past what its own comment claims.
        assertForbidden(
                MockServerWebExchange.from(
                        MockServerHttpRequest.put("/api/v1/actions/move").build()),
                mcpPrincipal());
        assertForbidden(
                MockServerWebExchange.from(
                        MockServerHttpRequest.put("/api/v1/actions/refactor").build()),
                mcpPrincipal());
    }

    @Test
    void mcpPrincipal_reservedSegmentIsDeniedRegardlessOfCasing() {
        // The deny must not be evadable by casing. WebFlux routing is case-sensitive so a mis-cased literal would
        // 404 anyway, but the control should not depend on that second-order fact.
        assertForbidden(
                MockServerWebExchange.from(
                        MockServerHttpRequest.put("/api/v1/actions/MOVE").build()),
                mcpPrincipal());
        assertForbidden(
                MockServerWebExchange.from(
                        MockServerHttpRequest.put("/api/v1/actions/Refactor").build()),
                mcpPrincipal());
    }

    @Test
    void mcpPrincipal_ordinaryActionIdStillPassesThrough() {
        // The reserved-segment guard must not break the legitimate case it sits next to.
        assertPassesThrough(
                MockServerWebExchange.from(MockServerHttpRequest.put("/api/v1/actions/65f0a1b2c3d4e5f6a7b8c9d0")
                        .build()),
                mcpPrincipal());
    }

    @Test
    void mcpPrincipal_percentEncodedNonAllowlistedPath_isDenied() {
        // Encoding must not smuggle a denied path past the allowlist. The filter and WebFlux routing consume the
        // same decoded RequestPath, so an encoded separator cannot make the two disagree — pinned here so a future
        // change to path handling cannot open a divergence silently.
        assertForbidden(
                MockServerWebExchange.from(
                        MockServerHttpRequest.post("/api/v1/users/mcp%2Dtokens").build()),
                mcpPrincipal());
    }

    @Test
    void mcpPrincipal_trailingSlashOnANonAllowlistedPath_isDenied() {
        assertForbidden(
                MockServerWebExchange.from(
                        MockServerHttpRequest.post("/api/v1/users/mcp-tokens/").build()),
                mcpPrincipal());
    }

    @Test
    void emptySecurityContext_passesThrough() {
        // No security context (anonymous, or context populated later in the chain): the control is a no-op. This
        // exercises the defaultIfEmpty(FALSE) branch, so it must invoke the chain exactly once and set no status.
        MockServerWebExchange exchange =
                MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/users/mcp-tokens"));
        AtomicInteger chainInvocations = new AtomicInteger(0);
        WebFilterChain chain = ex -> {
            chainInvocations.incrementAndGet();
            return Mono.empty();
        };

        // Deliberately no .contextWrite(...) -> ReactiveSecurityContextHolder.getContext() is empty.
        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(chainInvocations).hasValue(1);
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    private void assertPassesThrough(MockServerWebExchange exchange, Authentication authentication) {
        AtomicInteger chainInvocations = new AtomicInteger(0);
        WebFilterChain chain = ex -> {
            chainInvocations.incrementAndGet();
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)))
                .verifyComplete();

        // Exactly once — guards against a regression into the Mono<Void> + switchIfEmpty double-invocation bug.
        assertThat(chainInvocations).hasValue(1);
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    private void assertForbidden(MockServerWebExchange exchange, Authentication authentication) {
        AtomicInteger chainInvocations = new AtomicInteger(0);
        WebFilterChain chain = ex -> {
            chainInvocations.incrementAndGet();
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)))
                .verifyComplete();

        // The chain must never run for a denied request, and the response must be 403.
        assertThat(chainInvocations).hasValue(0);
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
