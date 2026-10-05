package com.appsmith.server.filters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.filters.ce.McpAllowlistExtensionsCE;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
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
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
    void mcpPrincipal_collectionBodyUpdate_isAllowed() {
        // update_js_object writes the compiled body through PUT /{id}/body (PATCH nulls the body); the rule covers
        // exactly that sub-path and nothing else under /collections/actions/{id}.
        assertPassesThrough(
                MockServerWebExchange.from(MockServerHttpRequest.put("/api/v1/collections/actions/abc123/body")),
                mcpPrincipal());
        assertForbidden(
                MockServerWebExchange.from(MockServerHttpRequest.put("/api/v1/collections/actions/abc123/refactor")),
                mcpPrincipal());
    }

    @Test
    void mcpPrincipal_actionRunBehaviour_isAllowed() {
        // create_mongo_query pins a `this.params` query to MANUAL through the run-behaviour route (the create
        // request cannot carry userSetOnLoad); the rule covers exactly that sub-path.
        assertPassesThrough(
                MockServerWebExchange.from(
                        MockServerHttpRequest.put("/api/v1/actions/runBehaviour/abc123?behaviour=MANUAL")),
                mcpPrincipal());
        assertForbidden(
                MockServerWebExchange.from(MockServerHttpRequest.put("/api/v1/actions/executeOnLoad/abc123")),
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
    void mcpPrincipal_reservedSegmentWithMatrixParameters_isDenied() {
        // Matrix parameters are the bypass: Spring's PathContainer splits ";..." off a segment, so PathPattern
        // matches "move;bypass=true" as {actionId} -> "move" and the router dispatches to the /move handler —
        // while a naive string scan of the raw path sees "move;bypass=true", fails to recognize the reserved
        // literal, and waves the request through.
        assertForbidden(
                MockServerWebExchange.from(MockServerHttpRequest.put("/api/v1/actions/move;bypass=true")
                        .build()),
                mcpPrincipal());
        assertForbidden(
                MockServerWebExchange.from(MockServerHttpRequest.put("/api/v1/actions/refactor;a=1;b=2")
                        .build()),
                mcpPrincipal());
        // Combined with the casing evasion, since the two are independent knobs.
        assertForbidden(
                MockServerWebExchange.from(
                        MockServerHttpRequest.put("/api/v1/actions/MoVe;x=1").build()),
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

    // A neutral fixture family — never a real edition family (e.g. EE's /api/v1/workflows) — so these tests stay valid
    // unchanged in every edition, whatever McpAllowlistExtensions ships there.
    private static final String FIXTURE_PREFIX = "/api/v1/mcp-extension-fixture";

    /** Extensions declaring the fixture prefix, the given rules, and the given extra reserved segments. */
    private static McpAllowlistExtensionsCE fixtureExtensions(List<McpAllowRule> rules, Set<String> reserved) {
        return extensions(List.of(FIXTURE_PREFIX), rules, reserved);
    }

    private static McpAllowlistExtensionsCE extensions(
            List<String> prefixes, List<McpAllowRule> rules, Set<String> reserved) {
        return new McpAllowlistExtensionsCE() {
            @Override
            public List<McpAllowRule> extensionRules() {
                return rules;
            }

            @Override
            public List<String> extensionPathPrefixes() {
                return prefixes;
            }

            @Override
            public Set<String> extensionReservedSegments() {
                return reserved;
            }
        };
    }

    private static McpAllowlistWebFilter fixtureFilter(McpAllowRule... rules) {
        return new McpAllowlistWebFilter(fixtureExtensions(List.of(rules), Set.of()));
    }

    @Test
    void ceExtensionsBase_declaresNothing() {
        // The CE base adds no rules, prefixes or reserved segments, so the edition hook cannot widen the cap in CE.
        McpAllowlistExtensionsCE base = new McpAllowlistExtensionsCE();
        assertThat(base.extensionRules()).isEmpty();
        assertThat(base.extensionPathPrefixes()).isEmpty();
        assertThat(base.extensionReservedSegments()).isEmpty();
    }

    @Test
    void defaultFilter_validatesAndAppendsTheEditionExtensions() {
        // Edition-neutral wiring: whatever McpAllowlistExtensions ships in this edition must pass construction-time
        // validation, and its rules must be appended after the core rules, unchanged.
        List<McpAllowRule> editionRules = new McpAllowlistExtensions().extensionRules();
        List<McpAllowRule> allRules = new McpAllowlistWebFilter().allowRules();

        assertThat(allRules.size()).isGreaterThan(editionRules.size());
        assertThat(allRules.subList(allRules.size() - editionRules.size(), allRules.size()))
                .isEqualTo(editionRules);
    }

    @Test
    void extensionRule_isAllowedAlongsideCoreRules() {
        McpAllowlistWebFilter extended = fixtureFilter(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/{id}"));

        assertPassesThrough(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/abc123")),
                mcpPrincipal());
        // Core rules still apply, and the extension rule is verb-exact.
        assertPassesThrough(
                extended, MockServerWebExchange.from(MockServerHttpRequest.get("/api/v1/users/me")), mcpPrincipal());
        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.delete(FIXTURE_PREFIX + "/abc123")),
                mcpPrincipal());
        // Without the extension, the same route is denied.
        assertForbidden(
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/abc123")), mcpPrincipal());
    }

    @Test
    void extensionRule_isStillSubjectToTheCoreReservedSegmentGuard() {
        McpAllowlistWebFilter extended = fixtureFilter(McpAllowRule.rule(HttpMethod.PUT, FIXTURE_PREFIX + "/{id}"));

        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.put(FIXTURE_PREFIX + "/move;x=1")),
                mcpPrincipal());
    }

    @Test
    void extensionReservedSegment_isDeniedAgainstAVariableRule() {
        // A sibling literal the edition declares (here "token") must not satisfy the {id} variable — including with
        // matrix parameters and casing, the same evasions the core guard is pinned against.
        McpAllowlistWebFilter extended = new McpAllowlistWebFilter(fixtureExtensions(
                List.of(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/{id}")), Set.of("Token")));

        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/token")),
                mcpPrincipal());
        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/token;a=1")),
                mcpPrincipal());
        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/TOKEN")),
                mcpPrincipal());
        // An ordinary id still passes next to it.
        assertPassesThrough(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/abc123")),
                mcpPrincipal());
    }

    @Test
    void extensionReservedSegment_doesNotDenyACoreRouteOutsideTheExtensionPrefix() {
        // An edition reserving "trigger" for its own routes must not 403 the core
        // POST /api/v1/datasources/{id}/trigger rule (get_datasource_structure): extension reserved segments are
        // scoped to paths under the extension prefixes.
        McpAllowlistWebFilter extended = new McpAllowlistWebFilter(fixtureExtensions(
                List.of(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/{id}")), Set.of("trigger")));

        assertPassesThrough(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/datasources/abc123/trigger")),
                mcpPrincipal());
        // The core reserved segments still apply everywhere.
        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.put("/api/v1/actions/move")),
                mcpPrincipal());
    }

    @Test
    void extensionReservedSegment_isDeniedUnderTheExtensionPrefix() {
        McpAllowlistWebFilter extended = new McpAllowlistWebFilter(fixtureExtensions(
                List.of(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/{id}")), Set.of("trigger")));

        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/trigger")),
                mcpPrincipal());
        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/trigger;a=1")),
                mcpPrincipal());
        assertForbidden(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/TrIgGeR;x=1")),
                mcpPrincipal());
        assertPassesThrough(
                extended,
                MockServerWebExchange.from(MockServerHttpRequest.get(FIXTURE_PREFIX + "/abc123")),
                mcpPrincipal());
    }

    @Test
    void extensionPrefix_withNonLiteralSegments_isRefusedAtConstruction() {
        // Every segment after /api/v1 must be [a-z0-9-]+: dot segments, dots, uppercase and percent-encoding are
        // refused so the prefix is exactly the literal the request-path comparison sees.
        for (String prefix :
                List.of("/api/v1/../users", "/api/v1/work.flows", "/api/v1/Workflows", "/api/v1/work%20flows")) {
            assertThatThrownBy(() -> new McpAllowlistWebFilter(extensions(List.of(prefix), List.of(), Set.of())))
                    .as(prefix)
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid extension prefix")
                    .hasMessageContaining(prefix);
        }
    }

    @Test
    void extensionRule_catchAllPattern_isRefusedAtConstruction() {
        assertThatThrownBy(() -> fixtureFilter(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/**")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("catch-all");
        assertThatThrownBy(() -> fixtureFilter(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/{*rest}")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("catch-all");
    }

    @Test
    void extensionRule_regexConstrainedVariable_isRefusedAtConstruction() {
        // A constraint regex hides which literals the variable accepts, so the sample-path checks cannot reason about
        // it ({keyId:[a-f0-9]+} slipped past the token-route sample check).
        assertThatThrownBy(() -> fixtureFilter(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/{id:[a-f0-9]+}")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("regex-constrained variable");
    }

    @Test
    void extensionRule_containingMcpTokens_isRefusedAtConstruction() {
        assertThatThrownBy(() -> fixtureFilter(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/MCP-Tokens")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("token-management");
    }

    @Test
    void extensionRule_onTheTokenRoutesDirectly_isRefusedAtConstruction() {
        // Refused whichever check trips first (token-management or outside the prefixes).
        assertThatThrownBy(() -> fixtureFilter(McpAllowRule.rule(HttpMethod.POST, "/api/v1/users/mcp-tokens")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void extensionRule_outsideTheDeclaredPrefixes_isRefusedAtConstruction() {
        assertThatThrownBy(() -> fixtureFilter(McpAllowRule.rule(HttpMethod.GET, "/api/v1/somewhere-else/{id}")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("outside the declared extension prefixes");
        // Sharing the prefix as a string prefix is not enough: the rule must be under it on a segment boundary.
        assertThatThrownBy(() -> fixtureFilter(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "-other/{id}")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("outside the declared extension prefixes");
        // No declared prefixes -> every rule is outside them.
        assertThatThrownBy(() -> new McpAllowlistWebFilter(extensions(
                        List.of(), List.of(McpAllowRule.rule(HttpMethod.GET, FIXTURE_PREFIX + "/{id}")), Set.of())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("outside the declared extension prefixes");
    }

    @Test
    void extensionPrefix_inACoreRouteFamily_isRefusedAtConstruction() {
        assertThatThrownBy(() -> new McpAllowlistWebFilter(
                        extensions(List.of("/api/v1/applications/extra"), List.of(), Set.of())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("core route family");
    }

    @Test
    void extensionPrefix_malformed_isRefusedAtConstruction() {
        for (String prefix : List.of(
                "/workflows/extra", "/api/v1", "/api/v1/", "/api/v1/{family}", "/api/v1/fixture/", "/api/v1/fix*")) {
            assertThatThrownBy(() -> new McpAllowlistWebFilter(extensions(List.of(prefix), List.of(), Set.of())))
                    .as(prefix)
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid extension prefix");
        }
        assertThatThrownBy(() ->
                        new McpAllowlistWebFilter(extensions(List.of("/api/v1/mcp-tokens-extra"), List.of(), Set.of())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("token-management");
    }

    @Test
    void extensionReservedSegment_malformed_isRefusedAtConstruction() {
        for (String segment : List.of("", "  ", "a/b", "token;x=1")) {
            assertThatThrownBy(() -> new McpAllowlistWebFilter(fixtureExtensions(List.of(), Set.of(segment))))
                    .as(segment)
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid reserved segment");
        }
    }

    private void assertPassesThrough(MockServerWebExchange exchange, Authentication authentication) {
        assertPassesThrough(filter, exchange, authentication);
    }

    private void assertForbidden(MockServerWebExchange exchange, Authentication authentication) {
        assertForbidden(filter, exchange, authentication);
    }

    private static void assertPassesThrough(
            McpAllowlistWebFilter filter, MockServerWebExchange exchange, Authentication authentication) {
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

    private static void assertForbidden(
            McpAllowlistWebFilter filter, MockServerWebExchange exchange, Authentication authentication) {
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
