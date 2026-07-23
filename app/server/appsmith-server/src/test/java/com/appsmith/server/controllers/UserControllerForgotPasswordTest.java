package com.appsmith.server.controllers;

import com.appsmith.server.configurations.RedisTestContainerConfig;
import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.EntityExchangeResult;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

/**
 * Controller-level anti-enumeration guard (CWE-204, GHSA-fvrq-g89c-fgg6) for the unauthenticated
 * {@code POST /api/v1/users/forgotPassword} endpoint.
 *
 * <p>The property under test is indistinguishability: the HTTP response (status line AND body) must be
 * identical whether the email is a known account under its reset limit, a known account over its limit, or
 * an unknown address. The full end-to-end rate-limit behaviour (counter accumulation, over-limit, window
 * reset) is covered at the service layer by {@code UserServiceTest}; here the service is mocked so the
 * controller's own response contract is what is pinned. Post-fix the service yields the same generic
 * success ({@code true}) for all three cases, so all three must produce byte-identical HTTP responses. A
 * regression that let any case surface a distinct error (e.g. a 404 or 429 from a thrown exception) would
 * change that case's status and body and fail this test.
 *
 * <p>Note on the body: this endpoint is annotated {@code @JsonView(Views.Public.class)} and returns a bare
 * {@code Boolean}; under the application's view-based serialization the success body is empty (the client
 * only depends on the 200 status). This test therefore asserts the full response is identical across cases
 * rather than pinning a particular JSON envelope — identical status + body is the anti-enumeration bar.
 */
@SpringBootTest
@AutoConfigureWebTestClient
@Import({SecurityTestConfig.class, RedisUtils.class, RedisTestContainerConfig.class})
public class UserControllerForgotPasswordTest {

    @MockBean
    UserService userService;

    @Autowired
    private WebTestClient webTestClient;

    private EntityExchangeResult<byte[]> forgotPassword(String email) {
        return webTestClient
                .post()
                .uri("/api/v1/users/forgotPassword")
                .header(HttpHeaders.ORIGIN, "https://my-instance.example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue("{\"email\":\"" + email + "\"}"))
                .exchange()
                .expectBody()
                .returnResult();
    }

    @Test
    public void forgotPassword_returnsIdenticalResponse_forKnownUnderLimit_knownOverLimit_andUnknown() {
        // Post-fix the service yields the same generic success for every one of these cases; an over-limit
        // or unknown email no longer surfaces a distinct error (404 / 429) to the controller.
        Mockito.when(userService.forgotPasswordTokenGenerate(any())).thenReturn(Mono.just(true));

        EntityExchangeResult<byte[]> knownUnderLimit = forgotPassword("api_user");
        EntityExchangeResult<byte[]> knownOverLimit = forgotPassword("api_user");
        EntityExchangeResult<byte[]> unknown = forgotPassword("nobody-does-not-exist@example.com");

        // All three succeed with HTTP 200 ...
        assertEquals(HttpStatus.OK, knownUnderLimit.getStatus());
        assertEquals(HttpStatus.OK, knownOverLimit.getStatus());
        assertEquals(HttpStatus.OK, unknown.getStatus());

        // ... and their bodies are byte-identical, so the caller cannot tell the cases apart.
        byte[] under = normalize(knownUnderLimit.getResponseBody());
        assertArrayEquals(under, normalize(knownOverLimit.getResponseBody()));
        assertArrayEquals(under, normalize(unknown.getResponseBody()));
    }

    @Test
    public void forgotPassword_emptyServiceCompletion_returnsSameSuccessResponse() {
        // Base-URL-unresolved path (Root Cause 1): the service completes empty; the controller's
        // defaultIfEmpty(true) must still produce the same HTTP 200 success as the value-emitting path.
        Mockito.when(userService.forgotPasswordTokenGenerate(any())).thenReturn(Mono.just(true));
        EntityExchangeResult<byte[]> emitted = forgotPassword("api_user");

        Mockito.when(userService.forgotPasswordTokenGenerate(any())).thenReturn(Mono.empty());
        EntityExchangeResult<byte[]> empty = forgotPassword("api_user");

        assertEquals(HttpStatus.OK, emitted.getStatus());
        assertEquals(HttpStatus.OK, empty.getStatus());
        assertArrayEquals(normalize(emitted.getResponseBody()), normalize(empty.getResponseBody()));
    }

    private static byte[] normalize(byte[] body) {
        return body == null ? new byte[0] : body;
    }
}
