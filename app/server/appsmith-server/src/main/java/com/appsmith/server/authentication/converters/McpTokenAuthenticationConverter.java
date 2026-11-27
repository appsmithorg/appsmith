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
        String clientAddress = clientAddress(exchange);
        InternalMarkerCheck markerCheck = checkInternalMarker(
                commonConfig.getMcpInternalSecret(),
                exchange.getRequest().getHeaders().getFirst(FieldName.INTERNAL_MARKER));
        if (markerCheck != InternalMarkerCheck.VALID) {
            // The reason and client address tell support which side is wrong. A loopback address usually means the
            // request came from the MCP service. It can come from forwarded headers, so it is a hint, not proof.
            // The log never holds the secret or the header value.
            log.warn(
                    "Rejecting an MCP bearer on {} {} from {}: reason={}. {}",
                    exchange.getRequest().getMethod(),
                    exchange.getRequest().getPath().value(),
                    clientAddress,
                    markerCheck,
                    markerCheck.hint);
            return Mono.empty();
        }

        return Mono.just(new McpTokenAuthentication(token, clientAddress));
    }

    /**
     * Compares the internal marker header with {@code APPSMITH_MCP_INTERNAL_SECRET}. Only {@link
     * InternalMarkerCheck#VALID} accepts the request. The other values name why it was refused.
     */
    static InternalMarkerCheck checkInternalMarker(String secret, String provided) {
        if (!hasText(secret)) {
            return InternalMarkerCheck.SERVER_SECRET_UNSET;
        }

        if (!hasText(provided)) {
            return InternalMarkerCheck.MARKER_HEADER_MISSING;
        }

        // Constant-time comparison so a caller cannot probe the secret byte-by-byte via response timing.
        // Do not add String.equals as a fallback. It stops at the first differing character, so it would undo
        // this protection, and it accepts nothing that this comparison rejects.
        boolean equal = MessageDigest.isEqual(
                secret.getBytes(StandardCharsets.UTF_8), provided.getBytes(StandardCharsets.UTF_8));

        return equal ? InternalMarkerCheck.VALID : InternalMarkerCheck.MARKER_MISMATCH;
    }

    enum InternalMarkerCheck {
        VALID(""),
        SERVER_SECRET_UNSET("The backend has no APPSMITH_MCP_INTERNAL_SECRET. When MCP is on, the backend creates one"
                + " at startup. Check the startup log for why it did not. If the log shows no repair, turn MCP off"
                + " and on in Admin Settings, and wait for the restart to finish."),
        MARKER_HEADER_MISSING(
                "The request has no X-Appsmith-Mcp-Internal header. Either the MCP process has no"
                        + " APPSMITH_MCP_INTERNAL_SECRET, or a raw mcp_ token was sent straight to /api/v1. If it came from the MCP service, restart the container."),
        MARKER_MISMATCH("The X-Appsmith-Mcp-Internal header does not match the backend's APPSMITH_MCP_INTERNAL_SECRET."
                + " The MCP process and the backend loaded different values. Restart the container.");

        private final String hint;

        InternalMarkerCheck(String hint) {
            this.hint = hint;
        }
    }

    private String clientAddress(ServerWebExchange exchange) {
        InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress == null || remoteAddress.getAddress() == null) {
            return "unknown";
        }

        return remoteAddress.getAddress().getHostAddress();
    }
}
