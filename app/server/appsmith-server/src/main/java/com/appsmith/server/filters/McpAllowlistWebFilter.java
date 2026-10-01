package com.appsmith.server.filters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.filters.ce.McpAllowlistExtensionsCE;
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
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.server.filters.McpAllowRule.rule;

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

    // The COMPLETE set of method+path families the loopback MCP Node client calls on /api/v1. Anything else for an
    // MCP principal -> 403. This list is the server-side mirror of the endpoints in the Node API client
    // (app/client/packages/mcp/src/app.ts, `createAppsmithApi`): a new MCP tool that calls a new endpoint must add a
    // rule here or it will 403 (fails closed). Note POST /api/v1/users/mcp-tokens (token minting) is intentionally
    // absent, so an MCP token can never mint another (double-covered: McpTokenControllerCE also blocks it).
    // Edition-specific tools add their endpoints through McpAllowlistExtensions, never by editing this list.
    private static final List<McpAllowRule> CORE_RULES = List.of(
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
            // A query that reads `this.params` must never run on page load (a missing param reaches Mongo as null).
            // `userSetOnLoad` is not deserialised from a create request (Views.Internal only), so the only way to pin
            // MANUAL run behaviour is this route — the same one the editor's run-behaviour dropdown calls.
            rule(HttpMethod.PUT, "/api/v1/actions/runBehaviour/{actionId}"),
            rule(HttpMethod.DELETE, "/api/v1/actions/{actionId}"),
            rule(HttpMethod.POST, "/api/v1/actions/execute"),
            rule(HttpMethod.GET, "/api/v1/collections/actions"),
            rule(HttpMethod.POST, "/api/v1/collections/actions"),
            // ActionCollectionControllerCE maps the JS-object update as @PatchMapping("/{id}") — PUT is not served
            // (405), and the Node client sends PATCH accordingly.
            rule(HttpMethod.PATCH, "/api/v1/collections/actions/{collectionId}"),
            // The PATCH route nulls `body` server-side; a JS object's code is written only through this body route
            // (the same one the web editor uses). Without it update_js_object could rename but never change code.
            rule(HttpMethod.PUT, "/api/v1/collections/actions/{collectionId}/body"),
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

    // The MCP token-management routes (mint, rotate, list, revoke). No rule — core or extension — may match them: an
    // MCP token must never manage tokens. Sample paths stand in for the {keyId} variable.
    private static final List<PathContainer> TOKEN_MANAGEMENT_PATHS = Stream.of(
                    "/api/v1/users/mcp-tokens", "/api/v1/users/mcp-tokens/key", "/api/v1/users/mcp-tokens/key/rotate")
            .map(PathContainer::parsePath)
            .toList();

    // The route families (the segment right after /api/v1) the core rules curate. An extension prefix may not live in
    // one: the core list is the reviewed, complete set for those families, and an edition rule there would widen it
    // without touching this file. Derived from CORE_RULES so a new core family is covered without a second edit.
    private static final Set<String> CORE_ROUTE_FAMILIES = CORE_RULES.stream()
            .map(allowRule -> familySegment(allowRule.pattern().getPatternString()))
            .collect(Collectors.toUnmodifiableSet());

    // Matches a "{name:regex}" path variable. A constraint regex hides which literals the variable can take, so the
    // sample-path token check cannot reason about it (e.g. {keyId:[a-f0-9]+} slipped past it); refused outright.
    private static final Pattern REGEX_CONSTRAINED_VARIABLE = Pattern.compile("\\{[^}]*:");

    // A valid extension prefix: /api/v1 followed by one or more lowercase literal segments.
    private static final Pattern EXTENSION_PREFIX_SHAPE = Pattern.compile("/api/v1(/[a-z0-9-]+)+");

    private final List<McpAllowRule> allowRules;

    // Reserved segments the edition declares. Scoped to request paths under an extension prefix, so an edition's
    // sibling literal (which may coincide with a core route's literal) can never deny a core route.
    private final Set<String> extensionReservedSegments;

    // Each extension prefix as its path segments (e.g. ["api", "v1", "workflows"]), for segment-boundary matching.
    private final List<List<String>> extensionPrefixSegments;

    public McpAllowlistWebFilter() {
        this(new McpAllowlistExtensions());
    }

    /**
     * Core rules plus the edition's extensions. Prefixes, rules and reserved segments are validated here, at startup,
     * so a declaration that would widen the cap past "the endpoints the MCP client calls" fails loudly instead of
     * shipping.
     */
    McpAllowlistWebFilter(McpAllowlistExtensionsCE extensions) {
        List<String> prefixes = List.copyOf(extensions.extensionPathPrefixes());
        prefixes.forEach(McpAllowlistWebFilter::validateExtensionPrefix);

        List<McpAllowRule> extensionRules = List.copyOf(extensions.extensionRules());
        extensionRules.forEach(allowRule -> validateExtensionRule(allowRule, prefixes));

        Set<String> extensionReserved = new HashSet<>();
        for (String segment : extensions.extensionReservedSegments()) {
            extensionReserved.add(normaliseReservedSegment(segment));
        }

        this.extensionReservedSegments = Set.copyOf(extensionReserved);
        // Validated prefixes are lowercase literal segments, so splitting on "/" is exact.
        this.extensionPrefixSegments = prefixes.stream()
                .map(prefix -> List.of(prefix.substring(1).split("/")))
                .toList();
        this.allowRules =
                Stream.concat(CORE_RULES.stream(), extensionRules.stream()).toList();
    }

    /** Core rules followed by the edition's extension rules, in match order. */
    List<McpAllowRule> allowRules() {
        return allowRules;
    }

    private static void validateExtensionPrefix(String prefix) {
        // Every segment after /api/v1 must be [a-z0-9-]+: this refuses pattern syntax, empty segments (trailing or
        // doubled slashes), dot segments ("." / ".."), percent-encoding, matrix parameters, uppercase and "_", so the
        // prefix is exactly the literal the request-path segment comparison sees.
        if (prefix == null || !EXTENSION_PREFIX_SHAPE.matcher(prefix).matches()) {
            throw new IllegalArgumentException("MCP allowlist has an invalid extension prefix (must be a literal "
                    + "/api/v1/<family>[/...] path whose segments match [a-z0-9-]+): " + prefix);
        }
        if (prefix.toLowerCase(Locale.ROOT).contains("mcp-tokens")) {
            throw new IllegalArgumentException(
                    "MCP allowlist has an invalid extension prefix touching the token-management routes: " + prefix);
        }
        if (CORE_ROUTE_FAMILIES.contains(familySegment(prefix))) {
            throw new IllegalArgumentException(
                    "MCP allowlist extension prefix must not live in a core route family: " + prefix);
        }
    }

    private static void validateExtensionRule(McpAllowRule allowRule, List<String> prefixes) {
        String pattern = allowRule.pattern().getPatternString();
        // A catch-all ("**" or "{*var}") matches an open-ended set of routes, including ones added later.
        if (pattern.contains("**") || pattern.contains("{*")) {
            throw new IllegalArgumentException("MCP allowlist extension rule must not be a catch-all: " + pattern);
        }
        if (REGEX_CONSTRAINED_VARIABLE.matcher(pattern).find()) {
            throw new IllegalArgumentException(
                    "MCP allowlist extension rule must not use a regex-constrained variable: " + pattern);
        }
        // Both the literal check and the sample-path match below: the literal catches any spelling of the token family
        // the samples do not enumerate, the match catches variables that would capture it.
        if (pattern.toLowerCase(Locale.ROOT).contains("mcp-tokens")
                || TOKEN_MANAGEMENT_PATHS.stream()
                        .anyMatch(path -> allowRule.pattern().matches(path))) {
            throw new IllegalArgumentException(
                    "MCP allowlist extension rule must not match the MCP token-management routes: " + pattern);
        }
        if (prefixes.stream().noneMatch(prefix -> pattern.equals(prefix) || pattern.startsWith(prefix + "/"))) {
            throw new IllegalArgumentException(
                    "MCP allowlist extension rule is outside the declared extension prefixes " + prefixes + ": "
                            + pattern);
        }
    }

    private static String normaliseReservedSegment(String segment) {
        if (segment == null || segment.isBlank() || segment.contains("/") || segment.contains(";")) {
            throw new IllegalArgumentException(
                    "MCP allowlist has an invalid reserved segment (must be one non-blank path segment): " + segment);
        }
        return segment.toLowerCase(Locale.ROOT);
    }

    /** The route family of an /api/v1 path or pattern: the segment right after /api/v1, or "" if there is none. */
    private static String familySegment(String path) {
        String[] parts = path.split("/");
        return parts.length > 3 ? parts[3].toLowerCase(Locale.ROOT) : "";
    }

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
     * since ids are generated identifiers, so denying them costs nothing and keeps the allowlist honest. Applies to every
     * request path; an edition adds the sibling literals of its own routes via {@code extensionReservedSegments()},
     * which apply only to request paths under the edition's {@code extensionPathPrefixes()}.
     */
    private static final Set<String> RESERVED_ROUTE_SEGMENTS = Set.of("move", "refactor");

    private boolean isAllowed(ServerHttpRequest request) {
        HttpMethod method = request.getMethod();
        PathContainer path = request.getPath().pathWithinApplication();
        if (hasReservedFinalSegment(path)) {
            return false;
        }
        for (McpAllowRule allowRule : allowRules) {
            if (allowRule.matches(method, path)) {
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
    private boolean hasReservedFinalSegment(PathContainer path) {
        // Case-insensitive throughout: the allowlist must not be evadable by casing, even though WebFlux routing is
        // case-sensitive and a mis-cased literal would 404 rather than reach the sibling handler.
        List<String> segments = new ArrayList<>();
        for (PathContainer.Element element : path.elements()) {
            if (element instanceof PathContainer.PathSegment pathSegment) {
                segments.add(pathSegment.valueToMatch().toLowerCase(Locale.ROOT));
            }
        }
        if (segments.isEmpty()) {
            return false;
        }

        String lastSegment = segments.get(segments.size() - 1);
        if (RESERVED_ROUTE_SEGMENTS.contains(lastSegment)) {
            return true;
        }
        // Extension reserved segments apply only under an extension prefix, so an edition reserving a literal that a
        // core route also uses (e.g. "trigger") cannot deny that core route.
        return extensionReservedSegments.contains(lastSegment) && isUnderExtensionPrefix(segments);
    }

    /** Whether the (lowercased, parsed) request segments start with one of the extension prefixes' segments. */
    private boolean isUnderExtensionPrefix(List<String> segments) {
        for (List<String> prefix : extensionPrefixSegments) {
            if (segments.size() > prefix.size()
                    && segments.subList(0, prefix.size()).equals(prefix)) {
                return true;
            }
        }
        return false;
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
}
