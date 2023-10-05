package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UserProfileDTO;
import reactor.core.publisher.Mono;

public interface PACConfigurationServiceCE {
    Mono<UserProfileDTO> setRolesAndGroups(
            UserProfileDTO profile, User user, boolean showUsersAndGroups, boolean isCloudHosting);
}
