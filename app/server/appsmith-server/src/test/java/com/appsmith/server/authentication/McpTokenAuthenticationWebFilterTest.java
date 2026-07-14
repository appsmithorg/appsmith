package com.appsmith.server.authentication;

import com.appsmith.server.authentication.converters.McpTokenAuthenticationConverter;
import com.appsmith.server.authentication.managers.McpTokenAuthenticationManager;
import com.appsmith.server.constants.ce.McpHeaders;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.UserMcpTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint;
import org.springframework.security.web.server.authentication.ServerAuthenticationEntryPointFailureHandler;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class McpTokenAuthenticationWebFilterTest {

    private static final String SECRET = "internal-marker-secret";

    @Test
    void invalidMcpBearer_withValidMarker_returnsUnauthorizedFromAuthenticationFilter() {
        UserMcpTokenService service = mock(UserMcpTokenService.class);
        when(service.authenticate("mcp_invalid")).thenReturn(Mono.empty());

        authenticationClient(service)
                .get()
                .uri("/protected")
                .headers(headers -> {
                    headers.setBearerAuth("mcp_invalid");
                    headers.set(McpHeaders.INTERNAL_MARKER, SECRET);
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
        authenticationClient(mock(UserMcpTokenService.class))
                .get()
                .uri("/protected")
                .headers(headers -> headers.setBearerAuth("mcp_invalid"))
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void mcpBearer_withWrongMarker_fallsThroughUnauthenticated() {
        authenticationClient(mock(UserMcpTokenService.class))
                .get()
                .uri("/protected")
                .headers(headers -> {
                    headers.setBearerAuth("mcp_invalid");
                    headers.set(McpHeaders.INTERNAL_MARKER, "wrong-secret");
                })
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void nonMcpBearer_passesThroughToOtherAuthenticationMechanisms() {
        authenticationClient(mock(UserMcpTokenService.class))
                .get()
                .uri("/protected")
                .headers(headers -> headers.setBearerAuth("ordinary_bearer_token"))
                .exchange()
                .expectStatus()
                .isOk();
    }

    private WebTestClient authenticationClient(UserMcpTokenService service) {
        RateLimitService rateLimitService = mock(RateLimitService.class);
        when(rateLimitService.isRateLimitExceeded(anyString(), anyString())).thenReturn(Mono.just(false));
        when(rateLimitService.tryIncreaseCounter(anyString(), anyString())).thenReturn(Mono.just(true));
        AuthenticationWebFilter filter =
                new AuthenticationWebFilter(new McpTokenAuthenticationManager(service, rateLimitService));
        filter.setServerAuthenticationConverter(new McpTokenAuthenticationConverter(SECRET));
        filter.setAuthenticationFailureHandler(new ServerAuthenticationEntryPointFailureHandler(
                new HttpStatusServerEntryPoint(HttpStatus.UNAUTHORIZED)));

        return WebTestClient.bindToWebHandler(exchange -> filter.filter(
                        exchange, ignored -> exchange.getResponse().setComplete()))
                .build();
    }
}
