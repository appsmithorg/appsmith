package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static com.appsmith.server.constants.AccessControlConstants.ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS;
import static com.appsmith.server.constants.ce.AccessControlConstantsCE.UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
class PACConfigurationServiceTest {
    @Autowired
    PACConfigurationService pacConfigurationService;

    @Autowired
    CommonConfig commonConfig;

    @Autowired
    UserService userService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_pac_enabled))
                .thenReturn(Mono.just(true));
    }

    @Test
    public void test_getTenantConfiguration_featureFlagDisabled() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setShowRolesAndGroups(true);

        Mono<TenantConfiguration> tenantConfigurationMono =
                pacConfigurationService.getTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> Assertions.assertTrue(tenantConfiguration1.getShowRolesAndGroups()))
                .verifyComplete();
    }

    @Test
    public void test_updateTenantConfiguration_featureFlagDisabled() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setShowRolesAndGroups(true);

        Mono<TenantConfiguration> tenantConfigurationMono =
                pacConfigurationService.updateTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> Assertions.assertTrue(tenantConfiguration1.getShowRolesAndGroups()))
                .verifyComplete();
    }

    @Test
    public void test_setRolesAndGroups_pacDisabled() {
        UserProfileDTO userProfileDTO = new UserProfileDTO();
        Mono<UserProfileDTO> userProfileDTOMono =
                pacConfigurationService.setRolesAndGroups(userProfileDTO, null, false, false);
        StepVerifier.create(userProfileDTOMono)
                .assertNext(userProfileDTO1 -> {
                    assertThat(userProfileDTO1.getRoles())
                            .isEqualTo(List.of(ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS));
                    assertThat(userProfileDTO1.getGroups())
                            .isEqualTo(List.of(ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS));
                })
                .verifyComplete();
    }

    @Test
    public void test_setRolesAndGroups_pacEnabledCloudHosting() {
        commonConfig.setCloudHosting(true);
        UserProfileDTO userProfileDTO = new UserProfileDTO();
        Mono<UserProfileDTO> userProfileDTOMono =
                pacConfigurationService.setRolesAndGroups(userProfileDTO, null, true, true);
        StepVerifier.create(userProfileDTOMono)
                .assertNext(userProfileDTO1 -> {
                    assertThat(userProfileDTO1.getRoles())
                            .isEqualTo(
                                    List.of(
                                            UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC));
                    assertThat(userProfileDTO1.getGroups())
                            .isEqualTo(
                                    List.of(
                                            UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC));
                })
                .verifyComplete();
    }

    @Test
    public void test_setRolesAndGroups_pacEnabled() {
        String testName = "test_setRolesAndGroups_pacEnabled".toLowerCase();
        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);

        userService.createUser(user).block();
        user = userService.findByEmail(testName).block();

        UserProfileDTO userProfileDTO = new UserProfileDTO();
        Mono<UserProfileDTO> userProfileDTOMono =
                pacConfigurationService.setRolesAndGroups(userProfileDTO, user, true, false);
        StepVerifier.create(userProfileDTOMono)
                .assertNext(userProfileDTO1 -> {
                    // by default roles gets attached to a user, so it must be non-empty
                    assertThat(userProfileDTO1.getRoles()).isNotEmpty();
                    // we are not attaching any group, so it should be empty
                    assertThat(userProfileDTO1.getGroups()).isEmpty();
                })
                .verifyComplete();
    }
}
