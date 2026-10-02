package com.appsmith.server.authentication.helpers;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.web.server.WebFilterExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;

class AuthenticationFailureRetryHandlerCEImplTest {

    private static final String CALLBACK_PATH = "/login/oauth2/code/oidc";
    private static final String HOST = "app.example.com";

    private final AuthenticationFailureRetryHandlerCEImpl handler = new AuthenticationFailureRetryHandlerCEImpl();

    @ParameterizedTest
    @ValueSource(
            strings = {
                "a1b2c3@origin-https://app.example.com/app/my-app/page-1?ssoTrigger=oidc",
                "a1b2c3@origin-https://app.example.com@subdomain-acme",
                "a1b2c3@origin-https://app.example.com/applications@subdomain-acme"
            })
    void should_redirectToLoginPageOnStateOrigin_when_stateCarriesSameHostRedirectUrl(String state) {
        // Given
        MockServerHttpRequest request = MockServerHttpRequest.get(CALLBACK_PATH)
                .queryParam("state", state)
                .header("Host", HOST)
                .build();

        // When
        URI location = redirectLocation(request, invalidClientException());

        // Then
        assertThat(location).hasToString("https://app.example.com/user/login?error=true");
    }

    @Test
    void should_redirectToForwardedHostLoginPage_when_requestIsProxied() {
        // Given
        MockServerHttpRequest request = MockServerHttpRequest.get(CALLBACK_PATH)
                .queryParam("state", "a1b2c3@origin-https://app.example.com/app/my-app/page-1")
                .header("Host", "appsmith-internal:8080")
                .header("X-Forwarded-Host", HOST)
                .build();

        // When
        URI location = redirectLocation(request, invalidClientException());

        // Then
        assertThat(location).hasToString("https://app.example.com/user/login?error=true");
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"a1b2c3@origin-/applications", "a1b2c3"})
    void should_redirectToRelativeLoginPage_when_noOriginIsAvailable(String state) {
        // Given
        MockServerHttpRequest.BaseBuilder<?> builder =
                MockServerHttpRequest.get(CALLBACK_PATH).header("Host", HOST);
        if (state != null) {
            builder.queryParam("state", state);
        }

        // When
        URI location = redirectLocation(builder.build(), invalidClientException());

        // Then
        assertThat(location).hasToString("/user/login?error=true");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "a1b2c3@origin-https://evil.example.org",
                "a1b2c3@origin-https://evil.example.org@app.example.com",
                "a1b2c3@origin-//evil.example.org",
                "a1b2c3@origin-/\\evil.example.org",
                "a1b2c3@origin-HTTPS://evil.example.org",
                "a1b2c3@origin-https://app.example.com:8443"
            })
    void should_redirectToRelativeLoginPage_when_stateOriginIsUntrusted(String state) {
        // Given
        MockServerHttpRequest request = MockServerHttpRequest.get(CALLBACK_PATH)
                .queryParam("state", state)
                .header("Host", HOST)
                .build();

        // When
        URI location = redirectLocation(request, invalidClientException());

        // Then
        assertThat(location).hasToString("/user/login?error=true");
    }

    @Test
    void should_redirectToTrustedOriginLoginPage_when_stateOriginIsCrossHost() {
        // Given
        MockServerHttpRequest request = MockServerHttpRequest.get(CALLBACK_PATH)
                .queryParam("state", "a1b2c3@origin-https://evil.example.org/phish")
                .header("Host", HOST)
                .header("Origin", "https://app.example.com")
                .build();

        // When
        URI location = redirectLocation(request, invalidClientException());

        // Then
        assertThat(location).hasToString("https://app.example.com/user/login?error=true");
    }

    @Test
    void should_redirectToOriginLoginPageWithRedirectUrl_when_formLoginFailsWithoutState() {
        // Given
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/login")
                .queryParam("redirectUrl", "/app/my-app/page-1")
                .header("Host", HOST)
                .header("Origin", "https://app.example.com")
                .build();

        // When
        URI location = redirectLocation(request, invalidClientException());

        // Then
        assertThat(location)
                .hasToString("https://app.example.com/user/login?error=true&redirectUrl=%2Fapp%2Fmy-app%2Fpage-1");
    }

    @Test
    void should_redirectToRelativeLoginPage_when_originHeaderIsCrossHostWithoutState() {
        // Given
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/login")
                .header("Host", HOST)
                .header("Origin", "https://evil.example.org")
                .build();

        // When
        URI location = redirectLocation(request, invalidClientException());

        // Then
        assertThat(location).hasToString("/user/login?error=true");
    }

    @Test
    void should_appendErrorMessage_when_internalAuthenticationServiceExceptionOccurs() {
        // Given
        MockServerHttpRequest request = MockServerHttpRequest.get(CALLBACK_PATH)
                .queryParam("state", "a1b2c3@origin-https://app.example.com/applications")
                .header("Host", HOST)
                .build();

        // When
        URI location =
                redirectLocation(request, new InternalAuthenticationServiceException("Token endpoint unreachable"));

        // Then
        assertThat(location)
                .hasToString("https://app.example.com/user/login?error=true&message=Token+endpoint+unreachable");
    }

    private URI redirectLocation(MockServerHttpRequest request, AuthenticationException exception) {
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        WebFilterExchange webFilterExchange = new WebFilterExchange(exchange, filterExchange -> Mono.empty());

        StepVerifier.create(handler.retryAndRedirectOnAuthenticationFailure(webFilterExchange, exception))
                .verifyComplete();

        return exchange.getResponse().getHeaders().getLocation();
    }

    private static OAuth2AuthenticationException invalidClientException() {
        return new OAuth2AuthenticationException(new OAuth2Error("invalid_client"));
    }
}
