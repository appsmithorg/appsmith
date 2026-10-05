package com.external.plugins.utils;

import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.util.RestrictedHostFilter;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.test.StepVerifier;

import java.net.URI;
import java.net.UnknownHostException;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

public class RequestUtilsSsrfFilterTest {

    @BeforeAll
    public static void enableFilterForThisClass() {
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
    }

    @AfterAll
    public static void restoreSurefireDefault() {
        RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
    }

    @Test
    public void makeRequest_toDisallowedHost_isRejectedBySsrfFilter() {
        final ApiKeyAuth apiKeyAuth = new ApiKeyAuth();
        apiKeyAuth.setValue("test-api-key");

        StepVerifier.create(RequestUtils.makeRequest(
                        HttpMethod.GET,
                        URI.create("http://169.254.169.254/latest/meta-data"),
                        apiKeyAuth,
                        BodyInserters.empty()))
                .expectErrorSatisfies(throwable -> {
                    assertInstanceOf(UnknownHostException.class, throwable);
                    assertEquals(RestrictedHostFilter.HOST_NOT_ALLOWED, throwable.getMessage());
                })
                .verify(Duration.ofSeconds(10));
    }
}
