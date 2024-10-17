package com.appsmith.server.services.ce;

import com.appsmith.caching.components.CacheManager;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.FeaturesResponseDTO;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TenantService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.external.enums.FeatureFlagEnum.TENANT_TEST_FEATURE;
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

@ExtendWith(AfterAllCleanUpExtension.class)
@SpringBootTest
@Slf4j
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
    TenantService tenantService;

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
        cacheManager.evictAll("tenantNewFeatures").block();
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
    public void testGetFeaturesForUser_overrideWithTenantFeature() {

        // Assert feature flag is false before the tenant level flag overrides the existing flag
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.get(TENANT_TEST_FEATURE.toString()));
                })
                .verifyComplete();

        Map<String, Boolean> tenantFeatures = new HashMap<>();
        tenantFeatures.put(TENANT_TEST_FEATURE.toString(), false);
        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(tenantFeatures);
        doReturn(Mono.just(responseDTO)).when(cacheableFeatureFlagHelper).getRemoteFeaturesForTenant(any());
        // Assert true for same feature flag after tenant level flag overrides the existing flag
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertFalse(result.get(TENANT_TEST_FEATURE.toString()));
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
    public void getFeatures_withTenantIdentifier_redisKeyExists() {
        Map<String, Boolean> flags = new HashMap<>();
        flags.put(UUID.randomUUID().toString(), true);
        flags.put(UUID.randomUUID().toString(), false);
        FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
        featuresResponseDTO.setFeatures(flags);

        doReturn(Mono.just(featuresResponseDTO))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForTenant(any());

        String tenantIdentifier = UUID.randomUUID().toString();
        Mono<CachedFeatures> cachedFeaturesMono =
                cacheableFeatureFlagHelper.fetchCachedTenantFeatures(tenantIdentifier);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("tenantNewFeatures:" + tenantIdentifier);
        StepVerifier.create(cachedFeaturesMono.then(hasKeyMono))
                .assertNext(Assertions::assertTrue)
                .verifyComplete();
    }

    @Test
    public void evictFeatures_withTenantIdentifier_redisKeyDoesNotExist() {
        // Insert dummy value for tenant flags
        Map<String, Boolean> flags = new HashMap<>();
        flags.put(UUID.randomUUID().toString(), true);
        flags.put(UUID.randomUUID().toString(), false);
        FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
        featuresResponseDTO.setFeatures(flags);

        doReturn(Mono.just(featuresResponseDTO))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForTenant(any());

        String tenantIdentifier = UUID.randomUUID().toString();
        Mono<CachedFeatures> cachedFeaturesMono =
                cacheableFeatureFlagHelper.fetchCachedTenantFeatures(tenantIdentifier);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("tenantNewFeatures:" + tenantIdentifier);
        // Assert key is inserted in cache
        StepVerifier.create(cachedFeaturesMono.then(hasKeyMono))
                .assertNext(Assertions::assertTrue)
                .verifyComplete();

        Mono<Void> evictCache = cacheableFeatureFlagHelper.evictCachedTenantFeatures(tenantIdentifier);
        hasKeyMono = reactiveRedisTemplate.hasKey("tenantNewFeatures:" + tenantIdentifier);
        // Assert key is evicted from cache
        StepVerifier.create(evictCache.then(hasKeyMono))
                .assertNext(Assertions::assertFalse)
                .verifyComplete();
    }

    @Test
    public void
            getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations_emptyMapForPendingMigration_statesUpdate() {

        Mockito.when(featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(any()))
                .thenReturn(Mono.just(new HashMap<>()));

        featureFlagService
                .getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations()
                .block();
        StepVerifier.create(tenantService.getDefaultTenant())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration().getFeaturesWithPendingMigration())
                            .isEqualTo(new HashMap<>());
                    assertThat(tenant.getTenantConfiguration().getMigrationStatus())
                            .isEqualTo(COMPLETED);
                })
                .verifyComplete();
    }

    @Test
    public void
            getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations_disableMigration_statesUpdate() {

        Mockito.when(featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(any()))
                .thenReturn(Mono.just(Map.of(TENANT_TEST_FEATURE, DISABLE)));

        featureFlagService
                .getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations()
                .block();
        StepVerifier.create(tenantService.getDefaultTenant())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration().getFeaturesWithPendingMigration())
                            .isEqualTo(Map.of(TENANT_TEST_FEATURE, DISABLE));
                    assertThat(tenant.getTenantConfiguration().getMigrationStatus())
                            .isEqualTo(PENDING);
                })
                .verifyComplete();
    }

    @Test
    public void getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations_enableMigration_statesUpdate() {

        Mockito.when(featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(any()))
                .thenReturn(Mono.just(Map.of(TENANT_TEST_FEATURE, ENABLE)));

        featureFlagService
                .getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations()
                .block();
        StepVerifier.create(tenantService.getDefaultTenant())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration().getFeaturesWithPendingMigration())
                            .isEqualTo(Map.of(TENANT_TEST_FEATURE, ENABLE));
                    assertThat(tenant.getTenantConfiguration().getMigrationStatus())
                            .isEqualTo(PENDING);
                })
                .verifyComplete();
    }

    @Test
    public void getTenantFeatureFlags_withDefaultTenant_fetchLatestFlags() {

        Map<String, Boolean> tenantFeatures = new HashMap<>();
        tenantFeatures.put(TENANT_TEST_FEATURE.name(), true);
        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(tenantFeatures);
        doReturn(Mono.just(responseDTO)).when(cacheableFeatureFlagHelper).getRemoteFeaturesForTenant(any());
        StepVerifier.create(featureFlagService.getTenantFeatures())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.get(TENANT_TEST_FEATURE.name()));
                })
                .verifyComplete();
    }

    @Test
    public void getCachedTenantFeatureFlags_withDefaultTenant_tenantFeatureFlagsAreCached() {

        // Assert that the cached feature flags are empty before the remote fetch
        CachedFeatures cachedFeaturesBeforeRemoteCall = featureFlagService.getCachedTenantFeatureFlags();
        assertThat(cachedFeaturesBeforeRemoteCall.getFeatures()).hasSize(1);
        assertTrue(cachedFeaturesBeforeRemoteCall.getFeatures().get(TENANT_TEST_FEATURE.name()));

        Map<String, Boolean> tenantFeatures = new HashMap<>();
        tenantFeatures.put(TENANT_TEST_FEATURE.name(), false);
        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(tenantFeatures);
        doReturn(Mono.just(responseDTO)).when(cacheableFeatureFlagHelper).getRemoteFeaturesForTenant(any());
        StepVerifier.create(featureFlagService.getTenantFeatures())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertFalse(result.get(TENANT_TEST_FEATURE.name()));

                    // Check if the cached feature flags are updated after the remote fetch
                    CachedFeatures cachedFeaturesAfterRemoteCall = featureFlagService.getCachedTenantFeatureFlags();
                    assertFalse(cachedFeaturesAfterRemoteCall.getFeatures().get(TENANT_TEST_FEATURE.name()));
                })
                .verifyComplete();
    }
}
