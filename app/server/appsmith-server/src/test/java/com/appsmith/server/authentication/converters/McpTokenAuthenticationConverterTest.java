package com.appsmith.server.authentication.converters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.constants.ce.McpHeaders;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;

import static org.assertj.core.api.Assertions.assertThat;

class McpTokenAuthenticationConverterTest {

    private static final String SECRET = "internal-marker-secret";

    private final McpTokenAuthenticationConverter converter = new McpTokenAuthenticationConverter(SECRET);

    @Test
    void convert_identifiesMcpBearerToken_whenValidInternalMarkerPresent() {
        MockServerWebExchange exchange = exchangeWithBearer("mcp_token", SECRET);

        StepVerifier.create(converter.convert(exchange))
                .assertNext(authentication -> {
                    assertThat(authentication).isInstanceOf(McpTokenAuthentication.class);
                    assertThat(authentication.getCredentials()).isEqualTo("mcp_token");
                    assertThat(((McpTokenAuthentication) authentication).getClientAddress())
                            .isEqualTo("192.0.2.1");
                })
                .verifyComplete();
    }

    @Test
    void convert_rejectsMcpBearer_whenInternalMarkerMissing() {
        // A raw `Authorization: Bearer mcp_...` sent straight to /api/v1 (bypassing the loopback MCP service) has
        // no marker -> not authenticated -> falls through to .anyExchange().authenticated() -> 401.
        StepVerifier.create(converter.convert(exchangeWithBearer("mcp_token", null)))
                .verifyComplete();
    }

    @Test
    void convert_rejectsMcpBearer_whenInternalMarkerWrong() {
        StepVerifier.create(converter.convert(exchangeWithBearer("mcp_token", "wrong-secret")))
                .verifyComplete();
    }

    @Test
    void convert_failsClosed_whenInternalSecretUnset() {
        // Empty/unset APPSMITH_MCP_INTERNAL_SECRET must not authenticate any mcp_ token, even if the caller sends a
        // matching empty marker (mirrors the APPSMITH_INTERNAL_PASSWORD empty-string guard, GHSA-xfc5-796c-7hr9).
        McpTokenAuthenticationConverter unsetConverter = new McpTokenAuthenticationConverter("");

        StepVerifier.create(unsetConverter.convert(exchangeWithBearer("mcp_token", "")))
                .verifyComplete();
        StepVerifier.create(unsetConverter.convert(exchangeWithBearer("mcp_token", null)))
                .verifyComplete();
    }

    @Test
    void convert_preservesNonMcpBearerForOtherAuthenticationMechanisms() {
        StepVerifier.create(converter.convert(exchangeWithBearer("ordinary_bearer_token", SECRET)))
                .verifyComplete();
    }

    private MockServerWebExchange exchangeWithBearer(String token, String marker) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.get("/api/v1/users/me")
                .remoteAddress(new InetSocketAddress("192.0.2.1", 8080))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        if (marker != null) {
            builder = builder.header(McpHeaders.INTERNAL_MARKER, marker);
        }
        return MockServerWebExchange.from(builder);
    }
}
