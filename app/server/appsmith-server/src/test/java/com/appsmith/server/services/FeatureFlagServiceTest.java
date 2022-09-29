package com.appsmith.server.services;

import com.appsmith.server.featureflags.FeatureFlagEnum;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.ff4j.parser.yaml.YamlParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
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

    @TestConfiguration
    static class TestFeatureFlagConfig {

        @Bean
        FF4j ff4j() {
            FF4j ff4j = new FF4j(new YamlParser(), "features/init-flags-test.yml")
                    .audit(true)
                    .autoCreate(false);
            return ff4j;
        }
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

}
