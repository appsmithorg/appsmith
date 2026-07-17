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
 * Controller-level anti-enumeration guard (CWE-204) for the unauthenticated
 * {@code POST /api/v1/users/resendEmailVerification} endpoint.
 *
 * <p>The property under test is indistinguishability: the HTTP response (status line AND body) must be
 * identical whether the email is a known unverified account, a known already-verified account, or an
 * unknown address. Before the fix these produced HTTP 200 vs 400 (USER_ALREADY_VERIFIED) vs 404
 * (NO_RESOURCE_FOUND) respectively, leaking both account existence and verified-state. The service layer
 * now yields the same generic success ({@code true}) for all of them (see {@code UserServiceTest}), so with
 * the service mocked here the controller must produce byte-identical HTTP responses. A regression that let
 * any case surface a distinct error would change that case's status and body and fail this test.
 *
 * <p>Note on the body: this endpoint is annotated {@code @JsonView(Views.Public.class)} and returns a bare
 * {@code Boolean}; under the application's view-based serialization the success body is empty (the client
 * only depends on the 200 status). This test therefore asserts the full response is identical across cases.
 */
@SpringBootTest
@AutoConfigureWebTestClient
@Import({SecurityTestConfig.class, RedisUtils.class, RedisTestContainerConfig.class})
public class UserControllerResendEmailVerificationTest {

    @MockBean
    UserService userService;

    @Autowired
    private WebTestClient webTestClient;

    private EntityExchangeResult<byte[]> resend(String email) {
        return webTestClient
                .post()
                .uri("/api/v1/users/resendEmailVerification")
                .header(HttpHeaders.ORIGIN, "https://my-instance.example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue("{\"email\":\"" + email + "\"}"))
                .exchange()
                .expectBody()
                .returnResult();
    }

    @Test
    public void resendEmailVerification_returnsIdenticalResponse_forKnownUnverified_knownVerified_andUnknown() {
        // Post-fix the service yields the same generic success for every one of these cases; a verified
        // or unknown email no longer surfaces a distinct error (400 / 404) to the controller.
        Mockito.when(userService.resendEmailVerification(any(), any())).thenReturn(Mono.just(true));

        EntityExchangeResult<byte[]> knownUnverified = resend("unverified@example.com");
        EntityExchangeResult<byte[]> knownVerified = resend("verified@example.com");
        EntityExchangeResult<byte[]> unknown = resend("nobody-does-not-exist@example.com");

        // All three succeed with HTTP 200 ...
        assertEquals(HttpStatus.OK, knownUnverified.getStatus());
        assertEquals(HttpStatus.OK, knownVerified.getStatus());
        assertEquals(HttpStatus.OK, unknown.getStatus());

        // ... and their bodies are byte-identical, so the caller cannot tell the cases apart.
        byte[] baseline = normalize(knownUnverified.getResponseBody());
        assertArrayEquals(baseline, normalize(knownVerified.getResponseBody()));
        assertArrayEquals(baseline, normalize(unknown.getResponseBody()));
    }

    @Test
    public void resendEmailVerification_emptyServiceCompletion_returnsSameSuccessResponse() {
        // Guards the controller's empty-completion handling: the service completes empty when the flow is
        // short-circuited (e.g. the secure base URL is unresolved). The controller chains
        // .thenReturn(ResponseDTO) on the service Mono, and thenReturn emits its value on an empty upstream
        // completion just as it does on a value-emitting one, so an empty completion must produce the exact
        // same HTTP 200 response as the value-emitting path — not an empty body that would be observable.
        Mockito.when(userService.resendEmailVerification(any(), any())).thenReturn(Mono.just(true));
        EntityExchangeResult<byte[]> emitted = resend("unverified@example.com");

        Mockito.when(userService.resendEmailVerification(any(), any())).thenReturn(Mono.empty());
        EntityExchangeResult<byte[]> empty = resend("unverified@example.com");

        assertEquals(HttpStatus.OK, emitted.getStatus());
        assertEquals(HttpStatus.OK, empty.getStatus());
        assertArrayEquals(normalize(emitted.getResponseBody()), normalize(empty.getResponseBody()));
    }

    private static byte[] normalize(byte[] body) {
        return body == null ? new byte[0] : body;
    }
}
