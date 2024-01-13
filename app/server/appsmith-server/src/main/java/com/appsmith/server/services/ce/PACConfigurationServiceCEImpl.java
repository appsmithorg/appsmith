package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UserProfileDTO;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.constants.ce.AccessControlConstantsCE.UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC;

@Service
public class PACConfigurationServiceCEImpl implements PACConfigurationServiceCE {
    @Override
    public Mono<UserProfileDTO> setRolesAndGroups(
            UserProfileDTO profile, User user, boolean showUsersAndGroups, boolean isCloudHosting) {
        profile.setRoles(
                List.of(UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC));
        profile.setGroups(
                List.of(UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC));

        return Mono.just(profile);
    }
}
