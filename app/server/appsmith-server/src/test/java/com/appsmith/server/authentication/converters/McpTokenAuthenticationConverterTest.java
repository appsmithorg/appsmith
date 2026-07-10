package com.appsmith.server.authentication.converters;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

class McpTokenAuthenticationConverterTest {

    private final McpTokenAuthenticationConverter converter = new McpTokenAuthenticationConverter();

    @Test
    void convert_identifiesMcpBearerToken() {
        MockServerWebExchange exchange = exchangeWithBearer("mcp_token");

        StepVerifier.create(converter.convert(exchange))
                .assertNext(authentication -> {
                    assertThat(authentication).isInstanceOf(McpTokenAuthentication.class);
                    assertThat(authentication.getCredentials()).isEqualTo("mcp_token");
                })
                .verifyComplete();
    }

    @Test
    void convert_preservesNonMcpBearerForOtherAuthenticationMechanisms() {
        StepVerifier.create(converter.convert(exchangeWithBearer("ordinary_bearer_token")))
                .verifyComplete();
    }

    private MockServerWebExchange exchangeWithBearer(String token) {
        return MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token));
    }
}
