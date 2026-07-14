package com.appsmith.server.filters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
            rule(HttpMethod.PUT, "/api/v1/collections/actions/{collectionId}"),
            rule(HttpMethod.DELETE, "/api/v1/collections/actions/{collectionId}"),
            rule(HttpMethod.GET, "/api/v1/datasources"),
            rule(HttpMethod.POST, "/api/v1/datasources"),
            rule(HttpMethod.GET, "/api/v1/datasources/{id}/structure"),
            rule(HttpMethod.GET, "/api/v1/plugins"),
            rule(HttpMethod.GET, "/api/v1/themes/applications/{id}/current"),
            rule(HttpMethod.PUT, "/api/v1/themes/applications/{id}"));

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(authentication -> {
                    if (isMcpPrincipal(authentication) && !isAllowed(exchange.getRequest())) {
                        return forbidden(exchange);
                    }
                    return chain.filter(exchange);
                })
                // No security context yet (e.g. anonymous, or a non-MCP request whose context is populated later):
                // this control is a no-op — leave the rest of the chain to decide.
                .switchIfEmpty(Mono.defer(() -> chain.filter(exchange)));
    }

    private static boolean isMcpPrincipal(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (McpTokenAuthentication.MCP_AUTHORITY.equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    private static boolean isAllowed(ServerHttpRequest request) {
        HttpMethod method = request.getMethod();
        var path = request.getPath().pathWithinApplication();
        for (AllowRule allowRule : ALLOW_RULES) {
            if (allowRule.method().equals(method) && allowRule.pattern().matches(path)) {
                return true;
            }
        }
        return false;
    }

    private static Mono<Void> forbidden(ServerWebExchange exchange) {
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
