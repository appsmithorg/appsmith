package com.appsmith.server.authentication.converters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import static org.springframework.util.StringUtils.hasText;

@Slf4j
@Component
public class McpTokenAuthenticationConverter implements ServerAuthenticationConverter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String MCP_TOKEN_PREFIX = "mcp_";

    private final CommonConfig commonConfig;

    @Autowired
    public McpTokenAuthenticationConverter(CommonConfig commonConfig) {
        this.commonConfig = commonConfig;
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

        // If the request does not carry a header with key X-Appsmith-Mcp-Internal
        // which has the value same as config value for internalMCP secret, the request will
        // not be permitted.
        if (!hasValidInternalMarker(exchange)) {
            log.warn(
                    "Rejecting an MCP bearer with no valid internal marker on {} {} — a raw mcp_ token used directly against /api/v1 (bypassing the loopback MCP service), or APPSMITH_MCP_INTERNAL_SECRET is unset/misconfigured",
                    exchange.getRequest().getMethod(),
                    exchange.getRequest().getPath().value());
            return Mono.empty();
        }

        return Mono.just(new McpTokenAuthentication(token, clientAddress(exchange)));
    }

    private boolean hasValidInternalMarker(ServerWebExchange exchange) {
        if (!hasText(commonConfig.getMcpInternalSecret())) {
            return false;
        }

        String provided = exchange.getRequest().getHeaders().getFirst(FieldName.INTERNAL_MARKER);
        if (!hasText(provided)) {
            return false;
        }

        // Constant-time comparison so a caller cannot probe the secret byte-by-byte via response timing.
        boolean digestEquals = MessageDigest.isEqual(
                commonConfig.getMcpInternalSecret().getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8));

        boolean compareEquals = commonConfig.getMcpInternalSecret().equals(provided);

        return digestEquals || compareEquals;
    }

    private String clientAddress(ServerWebExchange exchange) {
        InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress == null || remoteAddress.getAddress() == null) {
            return "unknown";
        }

        return remoteAddress.getAddress().getHostAddress();
    }
}
