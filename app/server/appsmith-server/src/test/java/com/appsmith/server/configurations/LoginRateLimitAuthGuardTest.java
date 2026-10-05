package com.appsmith.server.configurations;

import com.appsmith.server.constants.Url;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.ratelimiting.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.test.StepVerifier;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static com.appsmith.server.constants.RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API;
import static com.appsmith.server.constants.RateLimitConstants.BUCKET_KEY_FOR_TEST_DATASOURCE_API;
import static com.appsmith.server.constants.RateLimitConstants.RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/** Login authentication and per-account rate limiting must use the same identity equivalence. */
@SpringBootTest
@Import({RedisTestContainerConfig.class, RedisUtils.class})
public class LoginRateLimitAuthGuardTest {

    private static final int LOGIN_ATTEMPT_LIMIT = 5;
    private static final String ENCODED_RATE_LIMIT_MESSAGE =
            URLEncoder.encode(RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED, StandardCharsets.UTF_8);

    private WebTestClient webTestClient;

    @Autowired
    RateLimitService rateLimitService;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("case variants share one per-account login bucket")
    void loginCaseVariants_shareOnePerAccountBucket() {
        String suffix = UUID.randomUUID() + "@example.com";
        List<String> caseVariants = List.of(
                "casevariant" + suffix,
                "Casevariant" + suffix,
                "cAsevariant" + suffix,
                "caSevariant" + suffix,
                "casEvariant" + suffix,
                "caseVariant" + suffix);

        for (int i = 0; i < LOGIN_ATTEMPT_LIMIT; i++) {
            login(caseVariants.get(i))
                    .expectStatus()
                    .is3xxRedirection()
                    .expectHeader()
                    .value(HttpHeaders.LOCATION, location -> assertThat(location)
                            .doesNotContain(ENCODED_RATE_LIMIT_MESSAGE));
        }

        login(caseVariants.get(LOGIN_ATTEMPT_LIMIT))
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .value(HttpHeaders.LOCATION, location -> assertThat(location).contains(ENCODED_RATE_LIMIT_MESSAGE));
    }

    @Test
    @DisplayName("an identity within its login budget reaches authentication")
    void loginWithinPerAccountBudget_reachesAuthentication() {
        login("within-budget-" + UUID.randomUUID() + "@example.com")
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .value(HttpHeaders.LOCATION, location -> assertThat(location)
                        .doesNotContain(ENCODED_RATE_LIMIT_MESSAGE));
    }

    @Test
    @DisplayName("login bucket reset uses the canonical identity")
    void loginBucketReset_usesTheSameCanonicalIdentity() {
        String email = "reset-identity-" + UUID.randomUUID() + "@example.com";

        for (int i = 0; i < LOGIN_ATTEMPT_LIMIT; i++) {
            StepVerifier.create(rateLimitService.tryIncreaseCounter(
                            BUCKET_KEY_FOR_LOGIN_API, email.toUpperCase(Locale.ROOT)))
                    .expectNext(true)
                    .verifyComplete();
        }

        StepVerifier.create(
                        rateLimitService.tryIncreaseCounter(BUCKET_KEY_FOR_LOGIN_API, email.toLowerCase(Locale.ROOT)))
                .expectNext(false)
                .verifyComplete();
        StepVerifier.create(rateLimitService.resetCounter(BUCKET_KEY_FOR_LOGIN_API, email))
                .verifyComplete();
        StepVerifier.create(
                        rateLimitService.tryIncreaseCounter(BUCKET_KEY_FOR_LOGIN_API, email.toUpperCase(Locale.ROOT)))
                .expectNext(true)
                .verifyComplete();
    }

    @Test
    @DisplayName("identities that resolve to the same account share one login bucket")
    void loginEquivalentUnicodeForms_shareOnePerAccountBucket() {
        String asciiIdentity = "case-sensitive-" + UUID.randomUUID() + "@example.com";
        String lookupEquivalentIdentity = asciiIdentity.replaceFirst("s", "\u017F");

        for (int i = 0; i < LOGIN_ATTEMPT_LIMIT; i++) {
            login(asciiIdentity)
                    .expectStatus()
                    .is3xxRedirection()
                    .expectHeader()
                    .value(HttpHeaders.LOCATION, location -> assertThat(location)
                            .doesNotContain(ENCODED_RATE_LIMIT_MESSAGE));
        }

        login(lookupEquivalentIdentity)
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .value(HttpHeaders.LOCATION, location -> assertThat(location).contains(ENCODED_RATE_LIMIT_MESSAGE));
    }

    @Test
    @DisplayName("login bucket reset uses the shared account identity")
    void loginBucketReset_usesEquivalentUnicodeForms() {
        String asciiIdentity = "service-reset-" + UUID.randomUUID() + "@example.com";
        String lookupEquivalentIdentity = asciiIdentity.replaceFirst("s", "\u017F");

        for (int i = 0; i < LOGIN_ATTEMPT_LIMIT; i++) {
            StepVerifier.create(rateLimitService.tryIncreaseCounter(BUCKET_KEY_FOR_LOGIN_API, lookupEquivalentIdentity))
                    .expectNext(true)
                    .verifyComplete();
        }

        StepVerifier.create(rateLimitService.tryIncreaseCounter(BUCKET_KEY_FOR_LOGIN_API, asciiIdentity))
                .expectNext(false)
                .verifyComplete();
        StepVerifier.create(rateLimitService.resetCounter(BUCKET_KEY_FOR_LOGIN_API, asciiIdentity))
                .verifyComplete();
        StepVerifier.create(rateLimitService.tryIncreaseCounter(BUCKET_KEY_FOR_LOGIN_API, lookupEquivalentIdentity))
                .expectNext(true)
                .verifyComplete();
    }

    @Test
    @DisplayName("non-login buckets preserve identity case")
    void nonLoginBucket_preservesIdentityCase() {
        String identity = "case-sensitive-" + UUID.randomUUID();
        String upperCaseIdentity = identity.toUpperCase(Locale.ROOT);

        for (int i = 0; i < 3; i++) {
            StepVerifier.create(
                            rateLimitService.tryIncreaseCounter(BUCKET_KEY_FOR_TEST_DATASOURCE_API, upperCaseIdentity))
                    .expectNext(true)
                    .verifyComplete();
        }

        StepVerifier.create(rateLimitService.tryIncreaseCounter(BUCKET_KEY_FOR_TEST_DATASOURCE_API, upperCaseIdentity))
                .expectNext(false)
                .verifyComplete();
        StepVerifier.create(rateLimitService.tryIncreaseCounter(BUCKET_KEY_FOR_TEST_DATASOURCE_API, identity))
                .expectNext(true)
                .verifyComplete();
    }

    private WebTestClient.ResponseSpec login(String username) {
        String csrfToken = UUID.randomUUID().toString();
        return webTestClient
                .post()
                .uri(Url.LOGIN_URL)
                .header(HttpHeaders.ORIGIN, "localhost")
                .cookie("XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("username", username)
                        .with("password", "incorrect-password")
                        .with("_csrf", csrfToken))
                .exchange();
    }
}
