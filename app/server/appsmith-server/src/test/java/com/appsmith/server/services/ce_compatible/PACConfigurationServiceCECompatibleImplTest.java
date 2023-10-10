package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.PACConfigurationService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static com.appsmith.server.constants.ce.AccessControlConstantsCE.UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
class PACConfigurationServiceCECompatibleImplTest {
    @Autowired
    PACConfigurationService pacConfigurationService;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_pac_enabled))
                .thenReturn(Mono.just(false));
    }

    @Test
    public void test_getTenantConfiguration_featureFlagDisabled() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setShowRolesAndGroups(true);

        Mono<TenantConfiguration> tenantConfigurationMono =
                pacConfigurationService.getTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantConfigurationMono)
                .assertNext(
                        tenantConfiguration1 -> Assertions.assertFalse(tenantConfiguration1.getShowRolesAndGroups()))
                .verifyComplete();
    }

    @Test
    public void test_updateTenantConfiguration_featureFlagDisabled() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setShowRolesAndGroups(true);

        Mono<TenantConfiguration> tenantConfigurationMono =
                pacConfigurationService.updateTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> Assertions.assertNull(tenantConfiguration1.getShowRolesAndGroups()))
                .verifyComplete();
    }

    @Test
    public void test_setRolesAndGroups_featureFlagDisabled() {
        UserProfileDTO userProfileDTO = new UserProfileDTO();
        Mono<UserProfileDTO> userProfileDTOMono =
                pacConfigurationService.setRolesAndGroups(userProfileDTO, null, false, false);
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
}
