package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.services.PACConfigurationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static com.appsmith.server.constants.ce.AccessControlConstantsCE.UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PACConfigurationServiceCETest {
    @Autowired
    PACConfigurationService pacConfigurationService;

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
