package com.appsmith.server.authentication.converters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.constants.ce.McpHeaders;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Slf4j
@Component
public class McpTokenAuthenticationConverter implements ServerAuthenticationConverter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String MCP_TOKEN_PREFIX = "mcp_";

    // The shared secret the loopback MCP Node service stamps on every /api/v1 call it makes on behalf of an mcp_
    // token (X-Appsmith-Mcp-Internal). Injected from APPSMITH_MCP_INTERNAL_SECRET; defaults to empty when unset.
    private final String internalSecret;

    public McpTokenAuthenticationConverter(@Value("${APPSMITH_MCP_INTERNAL_SECRET:}") String internalSecret) {
        this.internalSecret = internalSecret;
    }

    @Override
    public Mono<Authentication> convert(ServerWebExchange exchange) {
        String authorization = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            return Mono.empty();
        }

        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        if (!token.startsWith(MCP_TOKEN_PREFIX)) {
            return Mono.empty();
        }

        // Marker-secret gate (decision D2): an mcp_ bearer only authenticates when it also carries the internal
        // marker header that the loopback Node service adds from its own env and Caddy strips on ingress. A raw
        // `Authorization: Bearer mcp_...` sent directly to /api/v1 lacks the marker, so it falls through
        // unauthenticated -> .anyExchange().authenticated() -> 401. FAILS CLOSED when the secret is unset/empty
        // (mirrors the APPSMITH_INTERNAL_PASSWORD empty-string guard, GHSA-xfc5-796c-7hr9): MCP is then inoperative
        // but no mcp_ token can be exercised.
        if (!hasValidInternalMarker(exchange)) {
            // An mcp_ bearer reached here without a valid internal marker. On the legitimate loopback path the Node MCP
            // service always stamps the marker and Caddy strips any inbound copy, so this is a raw mcp_ token presented
            // directly to /api/v1 outside the MCP tool flow (or the marker secret is misconfigured/unset). Audit it —
            // NEVER logging the token or the marker value — then reject (falls through to 401).
            log.warn(
                    "Rejecting an MCP bearer with no valid internal marker on {} {} — a raw mcp_ token used directly against /api/v1 (bypassing the loopback MCP service), or APPSMITH_MCP_INTERNAL_SECRET is unset/misconfigured",
                    exchange.getRequest().getMethod(),
                    exchange.getRequest().getPath().value());
            return Mono.empty();
        }

        return Mono.just(new McpTokenAuthentication(token, clientAddress(exchange)));
    }

    private boolean hasValidInternalMarker(ServerWebExchange exchange) {
        if (internalSecret == null || internalSecret.isEmpty()) {
            return false;
        }

        String provided = exchange.getRequest().getHeaders().getFirst(McpHeaders.INTERNAL_MARKER);
        if (provided == null) {
            return false;
        }

        // Constant-time comparison so a caller cannot probe the secret byte-by-byte via response timing.
        return MessageDigest.isEqual(
                internalSecret.getBytes(StandardCharsets.UTF_8), provided.getBytes(StandardCharsets.UTF_8));
    }

    private String clientAddress(ServerWebExchange exchange) {
        InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress == null || remoteAddress.getAddress() == null) {
            return "unknown";
        }

        return remoteAddress.getAddress().getHostAddress();
    }
}
