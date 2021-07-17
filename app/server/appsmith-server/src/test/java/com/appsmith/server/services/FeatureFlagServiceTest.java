package com.appsmith.server.services;

import com.appsmith.server.featureflags.FeatureFlagEnum;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.test.StepVerifier;

import static com.appsmith.server.featureflags.FeatureFlagEnum.JS_EDITOR;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThat;
import static org.junit.Assert.assertTrue;


@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class FeatureFlagServiceTest {
    @Autowired
    FeatureFlagService featureFlagService;

    @Test
    @WithUserDetails(value = "api_user")
    public void checkTest() {
        StepVerifier.create(featureFlagService.check(FeatureFlagEnum.WEIGHTAGE))
                .assertNext(result -> assertFalse(result));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getFeaturesForUserTest() {
        StepVerifier.create(featureFlagService.getAllFeatureFlagsForUser())
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue("There should be a flag JS_EDITOR", result.keySet().contains(JS_EDITOR.toString()));
                });
    }

}
