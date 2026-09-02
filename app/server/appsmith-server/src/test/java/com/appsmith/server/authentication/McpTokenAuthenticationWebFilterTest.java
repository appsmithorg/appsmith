package com.appsmith.server.authentication;

import com.appsmith.server.authentication.converters.McpTokenAuthenticationConverter;
import com.appsmith.server.authentication.managers.McpTokenAuthenticationManager;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.McpTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint;
import org.springframework.security.web.server.authentication.ServerAuthenticationEntryPointFailureHandler;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class McpTokenAuthenticationWebFilterTest {

    @Mock
    private CommonConfig commonConfig;

    private static final String SECRET = "internal-marker-secret";

    @Test
    void invalidMcpBearer_withValidMarker_returnsUnauthorizedFromAuthenticationFilter() {
        McpTokenService service = mock(McpTokenService.class);
        when(service.authenticate("mcp_invalid")).thenReturn(Mono.empty());

        authenticationClient(service)
                .get()
                .uri("/protected")
                .headers(headers -> {
                    headers.setBearerAuth("mcp_invalid");
                    headers.set(FieldName.INTERNAL_MARKER, SECRET);
                })
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void mcpBearer_withoutMarker_fallsThroughUnauthenticated() {
        // No marker header -> the converter returns empty -> the MCP filter does not authenticate. The downstream
        // "chain" in this harness completes the exchange (200), proving the bearer was NOT consumed by MCP auth.
        // In the full app this same fall-through lands on .anyExchange().authenticated() -> 401.
        authenticationClient(mock(McpTokenService.class))
                .get()
                .uri("/protected")
                .headers(headers -> headers.setBearerAuth("mcp_invalid"))
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void mcpBearer_withWrongMarker_fallsThroughUnauthenticated() {
        authenticationClient(mock(McpTokenService.class))
                .get()
                .uri("/protected")
                .headers(headers -> {
                    headers.setBearerAuth("mcp_invalid");
                    headers.set(FieldName.INTERNAL_MARKER, "wrong-secret");
                })
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void nonMcpBearer_passesThroughToOtherAuthenticationMechanisms() {
        authenticationClient(mock(McpTokenService.class))
                .get()
                .uri("/protected")
                .headers(headers -> headers.setBearerAuth("ordinary_bearer_token"))
                .exchange()
                .expectStatus()
                .isOk();
    }

    private WebTestClient authenticationClient(McpTokenService service) {
        RateLimitService rateLimitService = mock(RateLimitService.class);
        when(commonConfig.getMcpInternalSecret()).thenReturn(SECRET);
        when(rateLimitService.tryIncreaseCounter(anyString(), anyString())).thenReturn(Mono.just(true));
        AuthenticationWebFilter filter =
                new AuthenticationWebFilter(new McpTokenAuthenticationManager(service, rateLimitService));
        filter.setServerAuthenticationConverter(new McpTokenAuthenticationConverter(commonConfig));
        filter.setAuthenticationFailureHandler(new ServerAuthenticationEntryPointFailureHandler(
                new HttpStatusServerEntryPoint(HttpStatus.UNAUTHORIZED)));

        return WebTestClient.bindToWebHandler(exchange -> filter.filter(
                        exchange, ignored -> exchange.getResponse().setComplete()))
                .build();
    }
}
