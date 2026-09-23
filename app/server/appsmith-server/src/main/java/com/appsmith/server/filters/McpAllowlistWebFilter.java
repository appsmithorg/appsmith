package com.appsmith.server.filters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.PathContainer;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Confines what an MCP-token-authenticated principal may call on /api/v1. Any request that authenticated via an
 * mcp_ token (carrying the {@link McpTokenAuthentication#MCP_AUTHORITY}) whose method+path is not on the allowlist
 * is rejected with 403, even though the token itself is valid. This narrows the blast radius of an MCP token to the
 * exact set of endpoints the MCP tool flow needs.
 *
 * <p>Deliberately a standalone, shared (CE) {@link WebFilter} rather than a rule inside
 * {@code SecurityConfig.authorizeExchange(...)}: that chain is divergent in EE and would drift. EE wires this same
 * filter into its own security chain so the control is enforced identically. Instantiated with {@code new} in
 * {@code SecurityConfig} (NOT a {@code @Component}) so it is added only to the security chain, not also
 * auto-registered as a global {@code WebFilter} by WebHttpHandlerBuilder.
 */
@Slf4j
public class McpAllowlistWebFilter implements WebFilter {

    private static final PathPatternParser PARSER = new PathPatternParser();

    // The COMPLETE set of method+path families the loopback MCP Node client calls on /api/v1. Anything else for an
    // MCP principal -> 403. This list is the server-side mirror of the endpoints in the Node API client
    // (app/client/packages/mcp/src/app.ts, `createAppsmithApi`): a new MCP tool that calls a new endpoint must add a
    // rule here or it will 403 (fails closed). Note POST /api/v1/users/mcp-tokens (token minting) is intentionally
    // absent, so an MCP token can never mint another (double-covered: McpTokenControllerCE also blocks it).
    private static final List<AllowRule> ALLOW_RULES = List.of(
            rule(HttpMethod.GET, "/api/v1/users/me"),
            rule(HttpMethod.GET, "/api/v1/workspaces/home"),
            rule(HttpMethod.GET, "/api/v1/applications/home"),
            rule(HttpMethod.GET, "/api/v1/applications/{id}"),
            rule(HttpMethod.POST, "/api/v1/applications/import/{workspaceId}"),
            rule(HttpMethod.POST, "/api/v1/applications/import/partial/{workspaceId}/{applicationId}"),
            rule(HttpMethod.POST, "/api/v1/applications/publish/{applicationId}"),
            rule(HttpMethod.GET, "/api/v1/pages"),
            rule(HttpMethod.GET, "/api/v1/pages/{pageId}"),
            rule(HttpMethod.POST, "/api/v1/pages"),
            rule(HttpMethod.PUT, "/api/v1/pages/{pageId}"),
            rule(HttpMethod.DELETE, "/api/v1/pages/{pageId}"),
            rule(HttpMethod.GET, "/api/v1/layouts/{layoutId}/pages/{pageId}"),
            rule(HttpMethod.PUT, "/api/v1/layouts/{layoutId}/pages/{pageId}"),
            rule(HttpMethod.GET, "/api/v1/actions"),
            rule(HttpMethod.POST, "/api/v1/actions"),
            rule(HttpMethod.PUT, "/api/v1/actions/{actionId}"),
            rule(HttpMethod.DELETE, "/api/v1/actions/{actionId}"),
            rule(HttpMethod.POST, "/api/v1/actions/execute"),
            rule(HttpMethod.GET, "/api/v1/collections/actions"),
            rule(HttpMethod.POST, "/api/v1/collections/actions"),
            // ActionCollectionControllerCE maps the JS-object update as @PatchMapping("/{id}") — PUT is not served
            // (405), and the Node client sends PATCH accordingly.
            rule(HttpMethod.PATCH, "/api/v1/collections/actions/{collectionId}"),
            rule(HttpMethod.DELETE, "/api/v1/collections/actions/{collectionId}"),
            // Git flow (read_git_status / create_branch / prepare_commit -> confirm_commit). The MCP layer confines
            // mutations to mcp/ agent branches; these rules only let the git wrappers through the token cap.
            rule(HttpMethod.GET, "/api/v1/git/applications/{id}/status"),
            rule(HttpMethod.GET, "/api/v1/git/applications/{id}/protected-branches"),
            rule(HttpMethod.GET, "/api/v1/git/applications/{id}/refs"),
            rule(HttpMethod.POST, "/api/v1/git/applications/{id}/create-ref"),
            rule(HttpMethod.POST, "/api/v1/git/applications/{id}/commit"),
            rule(HttpMethod.GET, "/api/v1/datasources"),
            rule(HttpMethod.POST, "/api/v1/datasources"),
            rule(HttpMethod.GET, "/api/v1/datasources/{id}/structure"),
            // Sheets discovery in get_datasource_structure: the MCP sends only server-chosen selector requestTypes
            // (SPREADSHEET_SELECTOR / SHEET_SELECTOR / COLUMNS_SELECTOR); the endpoint itself enforces datasource
            // EXECUTE permission per request.
            rule(HttpMethod.POST, "/api/v1/datasources/{id}/trigger"),
            rule(HttpMethod.GET, "/api/v1/plugins"),
            rule(HttpMethod.GET, "/api/v1/themes/applications/{id}/current"),
            rule(HttpMethod.PUT, "/api/v1/themes/applications/{id}"));

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        // Resolve the "should this request be blocked?" decision as a Boolean FIRST, then terminate through exactly one
        // branch. This deliberately does NOT flatMap straight to forbidden()/chain.filter() and then
        // .switchIfEmpty(...):
        // both of those return Mono<Void>, which always completes empty, so switchIfEmpty could not tell a genuinely
        // empty security context apart from a Void branch that just finished — and would re-invoke chain.filter after
        // forbidden() (letting a denied request through) and a second time on the allowed path (double invocation).
        // Keeping the decision as a non-Void Boolean lets defaultIfEmpty handle ONLY the truly-empty-context case (no
        // MCP constraint applies -> pass through) while the single terminal flatMap runs exactly one of the two paths.
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(authentication -> McpTokenAuthentication.isMcpPrincipal(authentication) && !isAllowed(request))
                // No security context yet (e.g. anonymous, or a non-MCP request whose context is populated later):
                // this control is a no-op — not blocked, leave the rest of the chain to decide.
                .defaultIfEmpty(Boolean.FALSE)
                .flatMap(blocked -> blocked ? forbidden(exchange) : chain.filter(exchange));
    }

    /**
     * Path segments that are real sibling ROUTES, not entity ids. A single-segment wildcard like
     * {@code /api/v1/actions/{actionId}} matches these literals too, so {@code PUT /api/v1/actions/move} and
     * {@code /refactor} would slip through on a rule meant only to update one action by id — quietly widening the
     * allowlist past "the complete set of endpoints the MCP client calls". No entity id can collide with these,
     * since ids are generated identifiers, so denying them costs nothing and keeps the allowlist honest.
     */
    private static final Set<String> RESERVED_ROUTE_SEGMENTS = Set.of("move", "refactor");

    private static boolean isAllowed(ServerHttpRequest request) {
        HttpMethod method = request.getMethod();
        PathContainer path = request.getPath().pathWithinApplication();
        if (hasReservedFinalSegment(path)) {
            return false;
        }
        for (AllowRule allowRule : ALLOW_RULES) {
            if (allowRule.method().equals(method) && allowRule.pattern().matches(path)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Whether the request's last path segment is a reserved sibling route.
     *
     * <p>This deliberately reads the PARSED {@link PathContainer} rather than scanning the raw path string, and uses
     * {@link PathContainer.PathSegment#valueToMatch()} — the very value {@link PathPattern} matches against. Anything
     * else lets the guard and the matcher disagree, which is exactly the bypass a string scan produced: WebFlux
     * splits matrix parameters off a segment, so {@code /api/v1/actions/move;bypass=true} matched the
     * {@code /api/v1/actions/{actionId}} rule as {@code move} and Spring's router dispatched it to the {@code /move}
     * handler, while a raw-string scan saw {@code move;bypass=true}, failed to recognize the reserved literal, and
     * allowed the request. Reading the same parsed value makes that class of divergence impossible by construction.
     */
    private static boolean hasReservedFinalSegment(PathContainer path) {
        String lastSegment = null;
        for (PathContainer.Element element : path.elements()) {
            if (element instanceof PathContainer.PathSegment pathSegment) {
                lastSegment = pathSegment.valueToMatch();
            }
        }

        // Case-insensitive: the allowlist must not be evadable by casing, even though WebFlux routing is
        // case-sensitive and a mis-cased literal would 404 rather than reach the sibling handler.
        return lastSegment != null && RESERVED_ROUTE_SEGMENTS.contains(lastSegment.toLowerCase(Locale.ROOT));
    }

    private static Mono<Void> forbidden(ServerWebExchange exchange) {
        // Audit the denial: a valid MCP principal reached an endpoint outside the tool allowlist. Log only method+path
        // (never the token or principal), so this 403 is greppable for security review without leaking the credential.
        log.warn(
                "MCP principal denied on {} {} — endpoint is not in the MCP tool allowlist",
                exchange.getRequest().getMethod(),
                exchange.getRequest().getPath().value());
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body =
                "{\"responseMeta\":{\"status\":403,\"success\":false},\"data\":null}".getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(body);
        return response.writeWith(Mono.just(buffer));
    }

    private static AllowRule rule(HttpMethod method, String pattern) {
        return new AllowRule(method, PARSER.parse(pattern));
    }

    private record AllowRule(HttpMethod method, PathPattern pattern) {}
}
