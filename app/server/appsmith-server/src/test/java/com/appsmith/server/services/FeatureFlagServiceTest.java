package com.appsmith.server.services;

import com.appsmith.server.featureflags.FeatureFlagEnum;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.ff4j.parser.yaml.YamlParser;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.test.StepVerifier;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;


@RunWith(SpringRunner.class)
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
                    assertTrue("There should be a flag TEST_FEATURE_2",
                            result.keySet().contains(FeatureFlagEnum.TEST_FEATURE_2.toString())
                    );
                    assertTrue(result.get(FeatureFlagEnum.TEST_FEATURE_2.toString()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testFeatureCheckForEmailStrategy() {
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue("There should be a flag TEST_FEATURE_3",
                            result.keySet().contains(FeatureFlagEnum.TEST_FEATURE_3.toString())
                    );
                    assertFalse(result.get(FeatureFlagEnum.TEST_FEATURE_3.toString()));
                })
                .verifyComplete();
    }

}
