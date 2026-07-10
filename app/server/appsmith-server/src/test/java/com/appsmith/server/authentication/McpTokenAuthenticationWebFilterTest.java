package com.appsmith.server.authentication;

import com.appsmith.server.authentication.converters.McpTokenAuthenticationConverter;
import com.appsmith.server.authentication.managers.McpTokenAuthenticationManager;
import com.appsmith.server.services.UserMcpTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint;
import org.springframework.security.web.server.authentication.ServerAuthenticationEntryPointFailureHandler;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class McpTokenAuthenticationWebFilterTest {

    @Test
    void invalidMcpBearer_returnsUnauthorizedFromAuthenticationFilter() {
        UserMcpTokenService service = mock(UserMcpTokenService.class);
        when(service.authenticate("mcp_invalid")).thenReturn(Mono.empty());

        authenticationClient(service)
                .get()
                .uri("/protected")
                .headers(headers -> headers.setBearerAuth("mcp_invalid"))
                .exchange()
                .expectStatus()
                .isUnauthorized();
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
        AuthenticationWebFilter filter = new AuthenticationWebFilter(new McpTokenAuthenticationManager(service));
        filter.setServerAuthenticationConverter(new McpTokenAuthenticationConverter());
        filter.setAuthenticationFailureHandler(new ServerAuthenticationEntryPointFailureHandler(
                new HttpStatusServerEntryPoint(HttpStatus.UNAUTHORIZED)));

        return WebTestClient.bindToWebHandler(exchange -> filter.filter(
                        exchange, ignored -> exchange.getResponse().setComplete()))
                .build();
    }
}
