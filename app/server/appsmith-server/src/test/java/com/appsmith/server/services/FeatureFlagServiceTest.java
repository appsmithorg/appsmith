package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.ff4j.conf.XmlParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;


@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class FeatureFlagServiceTest {
    @Autowired
    FeatureFlagService featureFlagService;

    @Autowired
    CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    @Autowired
    ReactiveRedisTemplate<String, Object> reactiveRedisTemplate;

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
    public void getFeatureFlags_withUserIdentifier_redisKeyExists(){
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
