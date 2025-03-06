package com.appsmith.server.services.ce;

import com.appsmith.caching.components.CacheManager;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.FeaturesResponseDTO;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.external.enums.FeatureFlagEnum.ORGANIZATION_TEST_FEATURE;
import static com.appsmith.server.constants.FeatureMigrationType.DISABLE;
import static com.appsmith.server.constants.FeatureMigrationType.ENABLE;
import static com.appsmith.server.constants.MigrationStatus.COMPLETED;
import static com.appsmith.server.constants.MigrationStatus.PENDING;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;

@SpringBootTest
@Slf4j
@DirtiesContext
@ActiveProfiles(profiles = "test")
public class FeatureFlagServiceCETest {
    @Autowired
    FeatureFlagService featureFlagService;

    @SpyBean
    CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    @Autowired
    ReactiveRedisTemplate<String, Object> reactiveRedisTemplate;

    @SpyBean
    CacheManager cacheManager;

    @MockBean
    FeatureFlagMigrationHelper featureFlagMigrationHelper;

    @Autowired
    OrganizationService organizationService;

    @BeforeEach
    void setup() {
        doReturn(Mono.empty()).when(cacheManager).get(anyString(), anyString());
    }

    /**
     *  Clean up the cache after each test to avoid interfering with test assertions.
     */
    @AfterEach
    void tearDown() {
        cacheManager.evictAll("featureFlag").block();
        cacheManager.evictAll("organizationNewFeatures").block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testNullFeatureCheck() {
        StepVerifier.create(featureFlagService.check(null))
                .assertNext(Assertions::assertFalse)
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetFeaturesForUser() {
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.containsKey(FeatureFlagEnum.TEST_FEATURE_2.toString()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetFeaturesForUser_overrideWithOrganizationFeature() {

        // Assert feature flag is false before the org level flag overrides the existing flag
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.get(ORGANIZATION_TEST_FEATURE.toString()));
                })
                .verifyComplete();

        Map<String, Boolean> organizationFeatures = new HashMap<>();
        organizationFeatures.put(ORGANIZATION_TEST_FEATURE.toString(), false);
        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(organizationFeatures);
        doReturn(Mono.just(responseDTO)).when(cacheableFeatureFlagHelper).getRemoteFeaturesForOrganization(any());
        // Assert true for same feature flag after org level flag overrides the existing flag
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertFalse(result.get(ORGANIZATION_TEST_FEATURE.toString()));
                })
                .verifyComplete();
    }

    @Test
    public void getFeatureFlags_withUserIdentifier_redisKeyExists() {
        String userIdentifier = "testIdentifier";
        User dummyUser = new User();
        Mono<CachedFlags> cachedFlagsMono = cacheableFeatureFlagHelper.fetchUserCachedFlags(userIdentifier, dummyUser);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("featureFlag:" + userIdentifier);
        StepVerifier.create(cachedFlagsMono.then(hasKeyMono))
                .assertNext(Assertions::assertTrue)
                .verifyComplete();
    }

    @Test
    public void evictFeatureFlags_withUserIdentifier_redisKeyDoesNotExist() {
        String userIdentifier = "testIdentifier";
        Mono<Void> evictCache = cacheableFeatureFlagHelper.evictUserCachedFlags(userIdentifier);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("featureFlag:" + userIdentifier);
        StepVerifier.create(evictCache.then(hasKeyMono))
                .assertNext(Assertions::assertFalse)
                .verifyComplete();
    }

    @Test
    public void getFeatures_withOrganizationIdentifier_redisKeyExists() {
        Map<String, Boolean> flags = new HashMap<>();
        flags.put(UUID.randomUUID().toString(), true);
        flags.put(UUID.randomUUID().toString(), false);
        FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
        featuresResponseDTO.setFeatures(flags);

        doReturn(Mono.just(featuresResponseDTO))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForOrganization(any());

        String organizationIdentifier = UUID.randomUUID().toString();
        Mono<CachedFeatures> cachedFeaturesMono =
                cacheableFeatureFlagHelper.fetchCachedOrganizationFeatures(organizationIdentifier);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("organizationNewFeatures:" + organizationIdentifier);
        StepVerifier.create(cachedFeaturesMono.then(hasKeyMono))
                .assertNext(Assertions::assertTrue)
                .verifyComplete();
    }

    @Test
    public void evictFeatures_withOrganizationIdentifier_redisKeyDoesNotExist() {
        // Insert dummy value for org flags
        Map<String, Boolean> flags = new HashMap<>();
        flags.put(UUID.randomUUID().toString(), true);
        flags.put(UUID.randomUUID().toString(), false);
        FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
        featuresResponseDTO.setFeatures(flags);

        doReturn(Mono.just(featuresResponseDTO))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForOrganization(any());

        String organizationIdentifier = UUID.randomUUID().toString();
        Mono<CachedFeatures> cachedFeaturesMono =
                cacheableFeatureFlagHelper.fetchCachedOrganizationFeatures(organizationIdentifier);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("organizationNewFeatures:" + organizationIdentifier);
        // Assert key is inserted in cache
        StepVerifier.create(cachedFeaturesMono.then(hasKeyMono))
                .assertNext(Assertions::assertTrue)
                .verifyComplete();

        Mono<Void> evictCache = cacheableFeatureFlagHelper.evictCachedOrganizationFeatures(organizationIdentifier);
        hasKeyMono = reactiveRedisTemplate.hasKey("organizationNewFeatures:" + organizationIdentifier);
        // Assert key is evicted from cache
        StepVerifier.create(evictCache.then(hasKeyMono))
                .assertNext(Assertions::assertFalse)
                .verifyComplete();
    }

    @Test
    public void
            getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations_emptyMapForPendingMigration_statesUpdate() {

        Mockito.when(featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(any()))
                .thenReturn(Mono.just(new HashMap<>()));

        organizationService
                .retrieveAll()
                .flatMap(
                        featureFlagService
                                ::getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations)
                .blockLast();
        StepVerifier.create(organizationService.getDefaultOrganization())
                .assertNext(organization -> {
                    assertThat(organization.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .isEqualTo(new HashMap<>());
                    assertThat(organization.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(COMPLETED);
                })
                .verifyComplete();
    }

    @Test
    public void
            getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations_disableMigration_statesUpdate() {

        Mockito.when(featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(any()))
                .thenReturn(Mono.just(Map.of(ORGANIZATION_TEST_FEATURE, DISABLE)));

        organizationService
                .retrieveAll()
                .flatMap(
                        featureFlagService
                                ::getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations)
                .blockLast();
        StepVerifier.create(organizationService.getDefaultOrganization())
                .assertNext(organization -> {
                    assertThat(organization.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .isEqualTo(Map.of(ORGANIZATION_TEST_FEATURE, DISABLE));
                    assertThat(organization.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(PENDING);
                })
                .verifyComplete();
    }

    @Test
    public void
            getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations_enableMigration_statesUpdate() {

        Mockito.when(featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(any()))
                .thenReturn(Mono.just(Map.of(ORGANIZATION_TEST_FEATURE, ENABLE)));

        organizationService
                .retrieveAll()
                .flatMap(
                        featureFlagService
                                ::getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations)
                .blockLast();
        StepVerifier.create(organizationService.getDefaultOrganization())
                .assertNext(organization -> {
                    assertThat(organization.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .isEqualTo(Map.of(ORGANIZATION_TEST_FEATURE, ENABLE));
                    assertThat(organization.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(PENDING);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getOrganizationFeatureFlags_withDefaultOrganization_fetchLatestFlags() {

        Map<String, Boolean> organizationFeatures = new HashMap<>();
        organizationFeatures.put(ORGANIZATION_TEST_FEATURE.name(), true);
        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(organizationFeatures);
        doReturn(Mono.just(responseDTO)).when(cacheableFeatureFlagHelper).getRemoteFeaturesForOrganization(any());
        StepVerifier.create(featureFlagService.getOrganizationFeatures())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.get(ORGANIZATION_TEST_FEATURE.name()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getCachedOrganizationFeatureFlags_withDefaultOrganization_organizationFeatureFlagsAreCached() {

        String orgId = ReactiveContextUtils.getCurrentUser().block().getOrganizationId();
        // Assert that the cached feature flags are empty before the remote fetch
        CachedFeatures cachedFeaturesBeforeRemoteCall = featureFlagService.getCachedOrganizationFeatureFlags(orgId);
        assertThat(cachedFeaturesBeforeRemoteCall.getFeatures()).hasSize(1);
        assertTrue(cachedFeaturesBeforeRemoteCall.getFeatures().get(ORGANIZATION_TEST_FEATURE.name()));

        Map<String, Boolean> organizationFeatures = new HashMap<>();
        organizationFeatures.put(ORGANIZATION_TEST_FEATURE.name(), false);
        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(organizationFeatures);
        doReturn(Mono.just(responseDTO)).when(cacheableFeatureFlagHelper).getRemoteFeaturesForOrganization(any());
        StepVerifier.create(featureFlagService.getOrganizationFeatures())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertFalse(result.get(ORGANIZATION_TEST_FEATURE.name()));

                    // Check if the cached feature flags are updated after the remote fetch
                    CachedFeatures cachedFeaturesAfterRemoteCall =
                            featureFlagService.getCachedOrganizationFeatureFlags(orgId);
                    assertFalse(cachedFeaturesAfterRemoteCall.getFeatures().get(ORGANIZATION_TEST_FEATURE.name()));
                })
                .verifyComplete();
    }
}
