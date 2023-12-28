package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.services.ce_compatible.UserGroupServiceCECompatible;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface UserGroupService extends UserGroupServiceCECompatible {

    Flux<UserGroupCompactDTO> findAllGroupsForUserWithoutPermission(String userId);

    Mono<Boolean> bulkRemoveUserFromGroupsWithoutPermission(User user, Set<String> groupIds);
}
