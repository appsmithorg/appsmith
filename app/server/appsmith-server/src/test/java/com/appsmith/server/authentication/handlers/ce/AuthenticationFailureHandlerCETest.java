package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.authentication.helpers.AuthenticationFailureRetryHandler;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthenticationFailureHandlerCETest {

    private AuthenticationFailureHandlerCE handler;
    private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        AuthenticationFailureRetryHandler retryHandler = mock(AuthenticationFailureRetryHandler.class);
        when(retryHandler.retryAndRedirectOnAuthenticationFailure(any(), any())).thenReturn(Mono.empty());
        meterRegistry = new SimpleMeterRegistry();
        handler = new AuthenticationFailureHandlerCE(retryHandler, meterRegistry);
    }

    @Test
    void onAuthenticationFailure_sanitizesCrlfInOAuth2ErrorCode() {
        String maliciousErrorCode = "invalid_grant\r\nINFO: Forged log entry";
        OAuth2Error error = new OAuth2Error(maliciousErrorCode, "some description", null);
        OAuth2AuthenticationException exception = new OAuth2AuthenticationException(error, "auth failed");

        // The handler should not throw — it sanitizes and logs safely
        handler.onAuthenticationFailure(null, exception).block();

        // Verify the metric tag was recorded with sanitized source (no CRLF)
        String recordedSource =
                meterRegistry.get("appsmith.login_failure").counter().getId().getTag("source");
        assertThat(recordedSource).doesNotContain("\r").doesNotContain("\n");
        assertThat(recordedSource).isEqualTo("invalid_grant__INFO: Forged log entry");
    }
}
