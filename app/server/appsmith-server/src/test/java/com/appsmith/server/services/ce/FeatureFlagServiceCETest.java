package com.appsmith.server.services.ce;

import com.appsmith.caching.components.CacheManager;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ce.FeaturesResponseDTO;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.FeatureFlagService;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.ff4j.conf.XmlParser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
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
                .assertNext(result -> {
                    assertFalse(result);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testFeatureCheckForPonderationStrategy() {
        Math.random();
        StepVerifier.create(featureFlagService.check(FeatureFlagEnum.TEST_FEATURE_2))
                .assertNext(result -> {
                    assertTrue(result);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testFeatureCheckForAppsmithUserStrategy() {
        StepVerifier.create(featureFlagService.check(FeatureFlagEnum.TEST_FEATURE_1))
                .assertNext(result -> {
                    assertFalse(result);
                })
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
    public void testFeatureCheckForEmailStrategy() {
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.containsKey(FeatureFlagEnum.TEST_FEATURE_3.toString()));
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
                    assertNull(result.get(FeatureFlagEnum.TENANT_TEST_FEATURE.toString()));
                })
                .verifyComplete();

        Map<String, Boolean> tenantFeatures = new HashMap<>();
        tenantFeatures.put(FeatureFlagEnum.TENANT_TEST_FEATURE.toString(), true);
        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(tenantFeatures);
        doReturn(Mono.just(responseDTO)).when(cacheableFeatureFlagHelper).getRemoteFeaturesForTenant(any());
        // Assert true for same feature flag after tenant level flag overrides the existing flag
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.get(FeatureFlagEnum.TENANT_TEST_FEATURE.toString()));
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
                .assertNext(isKeyPresent -> {
                    assertTrue(isKeyPresent);
                })
                .verifyComplete();
    }

    @Test
    public void evictFeatureFlags_withUserIdentifier_redisKeyDoesNotExist() {
        String userIdentifier = "testIdentifier";
        Mono<Void> evictCache = cacheableFeatureFlagHelper.evictUserCachedFlags(userIdentifier);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("featureFlag:" + userIdentifier);
        StepVerifier.create(evictCache.then(hasKeyMono))
                .assertNext(isKeyPresent -> {
                    assertFalse(isKeyPresent);
                })
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
    public void forceUpdateFeatures_withTenantIdentifier_cacheUpdate() {
        // Insert dummy value for tenant flags
        Map<String, Boolean> flags = new HashMap<>();
        String feature1 = UUID.randomUUID().toString();
        String feature2 = UUID.randomUUID().toString();
        String feature3 = UUID.randomUUID().toString();

        flags.put(feature1, true);
        flags.put(feature2, false);
        FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
        featuresResponseDTO.setFeatures(flags);

        FeaturesResponseDTO updatedFeaturesResponseDTO = new FeaturesResponseDTO();
        Map<String, Boolean> updatedFlags = new HashMap<>();
        updatedFlags.put(feature1, false);
        updatedFlags.put(feature2, true);
        updatedFlags.put(feature3, true);
        updatedFeaturesResponseDTO.setFeatures(updatedFlags);

        doReturn(Mono.just(featuresResponseDTO), Mono.just(updatedFeaturesResponseDTO))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForTenant(any());

        String tenantIdentifier = UUID.randomUUID().toString();
        Mono<Map<String, Boolean>> cachedFeaturesMono = featureFlagService.getTenantFeatures();
        // Assert key is inserted in cache
        StepVerifier.create(cachedFeaturesMono)
                .assertNext(cachedFeatures -> {
                    assertTrue(cachedFeatures.get(feature1));
                    assertFalse(cachedFeatures.get(feature2));
                })
                .verifyComplete();

        // Check after force update if we get updated values for existing features
        Mono<CachedFeatures> updatedCacheMono = featureFlagService.forceUpdateTenantFeatures(tenantIdentifier);
        // Assert if the cache entry is updated
        StepVerifier.create(updatedCacheMono)
                .assertNext(cachedFeatures -> {
                    assertFalse(cachedFeatures.getFeatures().get(feature1));
                    assertTrue(cachedFeatures.getFeatures().get(feature2));
                    assertTrue(cachedFeatures.getFeatures().get(feature3));
                })
                .verifyComplete();
    }

    @Test
    public void updateCachedTenantFeatures_withTenantIdentifier_cacheUpdates() {
        // Insert dummy value for tenant flags
        Map<String, Boolean> flags = new HashMap<>();
        String feature1 = UUID.randomUUID().toString();
        String feature2 = UUID.randomUUID().toString();
        String feature3 = UUID.randomUUID().toString();

        flags.put(feature1, true);
        flags.put(feature2, false);
        FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
        featuresResponseDTO.setFeatures(flags);

        FeaturesResponseDTO updatedFeaturesResponseDTO = new FeaturesResponseDTO();
        Map<String, Boolean> updatedFlags = new HashMap<>();
        updatedFlags.put(feature1, false);
        updatedFlags.put(feature2, true);
        updatedFlags.put(feature3, true);
        updatedFeaturesResponseDTO.setFeatures(updatedFlags);

        // Empty object is returned when CS API fails which is being mocked here
        doReturn(
                        Mono.just(featuresResponseDTO),
                        Mono.just(updatedFeaturesResponseDTO),
                        Mono.just(new FeaturesResponseDTO()))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForTenant(any());

        String tenantIdentifier = UUID.randomUUID().toString();
        Mono<CachedFeatures> cachedFeaturesMono =
                cacheableFeatureFlagHelper.fetchCachedTenantFeatures(tenantIdentifier);
        // Assert key is inserted in cache
        StepVerifier.create(cachedFeaturesMono)
                .assertNext(cachedFeatures -> {
                    assertTrue(cachedFeatures.getFeatures().get(feature1));
                    assertFalse(cachedFeatures.getFeatures().get(feature2));
                })
                .verifyComplete();

        // Check after force update if we get updated values for existing features
        Mono<CachedFeatures> updatedCacheMono = featureFlagService.forceUpdateTenantFeatures(tenantIdentifier);
        // Assert if the cache entry is updated
        StepVerifier.create(updatedCacheMono)
                .assertNext(cachedFeatures -> {
                    assertFalse(cachedFeatures.getFeatures().get(feature1));
                    assertTrue(cachedFeatures.getFeatures().get(feature2));
                    assertTrue(cachedFeatures.getFeatures().get(feature3));
                })
                .verifyComplete();
    }

    @TestConfiguration
    static class TestFeatureFlagConfig {

        @Bean
        FF4j ff4j() {
            FF4j ff4j = new FF4j(new XmlParser(), "features/init-flags-test.xml")
                    .audit(true)
                    .autoCreate(false);
            return ff4j;
        }
    }
}
