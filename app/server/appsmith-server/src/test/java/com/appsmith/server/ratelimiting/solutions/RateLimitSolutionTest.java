package com.appsmith.server.ratelimiting.solutions;

import com.appsmith.caching.components.CacheManager;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.ratelimiting.configuration.ProxyManagerConfiguration;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserService;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.BucketProxy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@AutoConfigureWebTestClient
class RateLimitSolutionTest {

    @Autowired
    ProxyManagerConfiguration proxyManagerConfiguration;

    @Autowired
    WebTestClient webTestClient;

    @Autowired
    UserService userService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserRepository userRepository;

    @Autowired
    TenantService tenantService;

    @Autowired
    RateLimitSolution rateLimitSolution;

    @Autowired
    CacheManager cacheManager;

    @BeforeEach
    public void setup() {
        User apiUser = userRepository.findByCaseInsensitiveEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
        Long evictAllCacheRelatedToLogin = cacheManager
                .getKeysWithPrefix(RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API)
                .map(keys -> {
                    keys.forEach(key -> proxyManagerConfiguration
                            .lettuceBasedProxyManager()
                            .getProxyConfiguration(key.getBytes())
                            .ifPresent(existingConfiguration -> {
                                proxyManagerConfiguration
                                        .lettuceBasedProxyManager()
                                        .removeProxy(key.getBytes());
                            }));
                    return 1L;
                })
                .block();
        TenantConfiguration enableInvalidLoginRateLimitTenantConfiguration = new TenantConfiguration();
        enableInvalidLoginRateLimitTenantConfiguration.setDisableRateLimitInvalidLogin(Boolean.FALSE);
        Tenant updatedTenant = tenantService
                .updateDefaultTenantConfiguration(enableInvalidLoginRateLimitTenantConfiguration)
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testUpdateApiProxyBucketForApiIdentifier_makeLoginNotRateLimited() {
        String userEmail = "testUpdateApiProxyBucketForApiIdentifier_makeLoginNotRateLimited@test.com".toLowerCase();
        String password = "testUpdateApiProxyBucketForApiIdentifier_makeLoginNotRateLimited";
        User user = new User();
        user.setEmail(userEmail);
        user.setPassword(password);
        User createdUser = userService.create(user).block();

        String validLoginBody = String.format("username=%s&password=%s", userEmail, password);

        String invalidLoginBody = String.format("username=%s&password=%s1", userEmail, password);

        WebTestClient.ResponseSpec validLoginForCreatedUser = webTestClient
                .post()
                .uri("/api/v1/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(validLoginBody)
                .exchange()
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .valueEquals("Location", "/applications");

        IntStream.range(0, 3).forEach(index -> {
            WebTestClient.ResponseSpec xxRedirection = webTestClient
                    .post()
                    .uri("/api/v1/login")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(invalidLoginBody)
                    .exchange()
                    .expectStatus()
                    .is3xxRedirection()
                    .expectHeader()
                    .valueEquals("Location", "//user/login?error=true");
        });

        String redisKeyForCreatedUser = String.format("login%s", userEmail);
        Optional<BucketConfiguration> optionalBucketConfigurationForCreatedUser = proxyManagerConfiguration
                .lettuceBasedProxyManager()
                .getProxyConfiguration(redisKeyForCreatedUser.getBytes());
        assertThat(optionalBucketConfigurationForCreatedUser.isPresent()).isTrue();
        assertThat(optionalBucketConfigurationForCreatedUser.get().getBandwidths())
                .hasSize(1);
        assertThat(optionalBucketConfigurationForCreatedUser
                        .get()
                        .getBandwidths()[0]
                        .getCapacity())
                .isEqualTo(RateLimitConstants.DEFAULT_PRESET_RATE_LIMIT_LOGIN_API.getLimit());
        assertThat(optionalBucketConfigurationForCreatedUser
                        .get()
                        .getBandwidths()[0]
                        .getRefillPeriodNanos())
                .isEqualTo(RateLimitConstants.DEFAULT_PRESET_RATE_LIMIT_LOGIN_API
                        .getRefillDuration()
                        .toNanos());
        BucketProxy bucketProxyForCreatedUser = proxyManagerConfiguration
                .lettuceBasedProxyManager()
                .builder()
                .build(redisKeyForCreatedUser.getBytes(), optionalBucketConfigurationForCreatedUser.get());
        assertThat(bucketProxyForCreatedUser.getAvailableTokens()).isEqualTo(2);

        TenantConfiguration disableInvalidLoginRateLimitTenantConfiguration = new TenantConfiguration();
        disableInvalidLoginRateLimitTenantConfiguration.setDisableRateLimitInvalidLogin(Boolean.TRUE);
        Tenant updatedTenant = tenantService
                .updateDefaultTenantConfiguration(disableInvalidLoginRateLimitTenantConfiguration)
                .block();

        BucketProxy bucketProxyLoginApi =
                rateLimitSolution.getApiProxyBuckets().get(RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API);
        assertThat(bucketProxyLoginApi.getAvailableTokens()).isEqualTo(1);

        BucketProxy bucketProxy = rateLimitSolution.getOrCreateAPIUserSpecificBucket(
                RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API, userEmail);
        assertThat(bucketProxy.getAvailableTokens()).isEqualTo(1);

        IntStream.range(0, 100).forEach(index -> {
            WebTestClient.ResponseSpec xxRedirection = webTestClient
                    .post()
                    .uri("/api/v1/login")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(invalidLoginBody)
                    .exchange()
                    .expectStatus()
                    .is3xxRedirection()
                    .expectHeader()
                    .valueEquals("Location", "//user/login?error=true");
            try {
                // Adding a sleep of 1ms
                Thread.sleep(1);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        });
        Optional<BucketConfiguration> optionalBucketConfigurationForCreatedUserPostDisablingRateLimiting =
                proxyManagerConfiguration
                        .lettuceBasedProxyManager()
                        .getProxyConfiguration(redisKeyForCreatedUser.getBytes());
        assertThat(optionalBucketConfigurationForCreatedUserPostDisablingRateLimiting.isPresent())
                .isTrue();
        assertThat(optionalBucketConfigurationForCreatedUserPostDisablingRateLimiting
                        .get()
                        .getBandwidths())
                .hasSize(1);
        assertThat(optionalBucketConfigurationForCreatedUserPostDisablingRateLimiting
                        .get()
                        .getBandwidths()[0]
                        .getCapacity())
                .isEqualTo(RateLimitConstants.DEFAULT_MAX_RATE_LIMIT_LOGIN_API.getLimit());
        assertThat(optionalBucketConfigurationForCreatedUserPostDisablingRateLimiting
                        .get()
                        .getBandwidths()[0]
                        .getRefillPeriodNanos())
                .isEqualTo(RateLimitConstants.DEFAULT_MAX_RATE_LIMIT_LOGIN_API
                        .getRefillDuration()
                        .toNanos());
        BucketProxy bucketProxyForCreatedUserPostDisablingRateLimiting = proxyManagerConfiguration
                .lettuceBasedProxyManager()
                .builder()
                .build(redisKeyForCreatedUser.getBytes(), optionalBucketConfigurationForCreatedUser.get());
        assertThat(bucketProxyForCreatedUserPostDisablingRateLimiting.getAvailableTokens())
                .isEqualTo(1);
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testLoginRateLimited_invalidLoginShouldRateLimit() {
        String userEmail = "testLoginRateLimited_invalidLoginShouldRateLimit@test.com".toLowerCase();
        String password = "testLoginRateLimited_invalidLoginShouldRateLimit";
        User user = new User();
        user.setEmail(userEmail);
        user.setPassword(password);
        User createdUser = userService.create(user).block();

        String validLoginBody = String.format("username=%s&password=%s", userEmail, password);

        String invalidLoginBody = String.format("username=%s&password=%s1", userEmail, password);

        WebTestClient.ResponseSpec validLoginForCreatedUser = webTestClient
                .post()
                .uri("/api/v1/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(validLoginBody)
                .exchange()
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .valueEquals("Location", "/applications");

        IntStream.range(0, 5).forEach(index -> {
            WebTestClient.ResponseSpec xxRedirection = webTestClient
                    .post()
                    .uri("/api/v1/login")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(invalidLoginBody)
                    .exchange()
                    .expectStatus()
                    .is3xxRedirection()
                    .expectHeader()
                    .valueEquals("Location", "//user/login?error=true");
        });

        WebTestClient.ResponseSpec xxRedirection = webTestClient
                .post()
                .uri("/api/v1/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(invalidLoginBody)
                .exchange()
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .valueEquals(
                        "Location",
                        String.format(
                                "/user/login?error=true&message=%s",
                                URLEncoder.encode(
                                        RateLimitConstants.RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED,
                                        StandardCharsets.UTF_8)));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testLoginRateLimitedWithDifferentCases_invalidLoginShouldRateLimit() {
        String userEmail = "testLoginRateLimited_invalidLoginShouldRateLimit@test.com";
        String password = "testLoginRateLimited_invalidLoginShouldRateLimit";
        User user = new User();
        user.setEmail(userEmail);
        user.setPassword(password);
        User createdUser = userService.create(user).block();

        String validLoginBody = String.format("username=%s&password=%s", userEmail, password);

        String invalidLoginBody1 = String.format("username=%s&password=%s1", userEmail, password);

        String invalidLoginBody2 = String.format("username=%s&password=%s1", userEmail.toLowerCase(), password);

        WebTestClient.ResponseSpec validLoginForCreatedUser = webTestClient
                .post()
                .uri("/api/v1/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(validLoginBody)
                .exchange()
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .valueEquals("Location", "/applications");

        IntStream.range(0, 3).forEach(index -> {
            WebTestClient.ResponseSpec xxRedirection = webTestClient
                    .post()
                    .uri("/api/v1/login")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(invalidLoginBody1)
                    .exchange()
                    .expectStatus()
                    .is3xxRedirection()
                    .expectHeader()
                    .valueEquals("Location", "//user/login?error=true");
        });

        IntStream.range(0, 2).forEach(index -> {
            WebTestClient.ResponseSpec xxRedirection = webTestClient
                    .post()
                    .uri("/api/v1/login")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(invalidLoginBody2)
                    .exchange()
                    .expectStatus()
                    .is3xxRedirection()
                    .expectHeader()
                    .valueEquals("Location", "//user/login?error=true");
        });

        WebTestClient.ResponseSpec xxRedirection1 = webTestClient
                .post()
                .uri("/api/v1/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(invalidLoginBody1)
                .exchange()
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .valueEquals(
                        "Location",
                        String.format(
                                "/user/login?error=true&message=%s",
                                URLEncoder.encode(
                                        RateLimitConstants.RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED,
                                        StandardCharsets.UTF_8)));

        WebTestClient.ResponseSpec xxRedirection2 = webTestClient
                .post()
                .uri("/api/v1/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(invalidLoginBody2)
                .exchange()
                .expectStatus()
                .is3xxRedirection()
                .expectHeader()
                .valueEquals(
                        "Location",
                        String.format(
                                "/user/login?error=true&message=%s",
                                URLEncoder.encode(
                                        RateLimitConstants.RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED,
                                        StandardCharsets.UTF_8)));
    }
}
