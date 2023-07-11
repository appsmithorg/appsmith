package com.appsmith.server.repositories;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.ce.PermissionGroupRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.Set;

@Repository
public interface PermissionGroupRepository extends PermissionGroupRepositoryCE, CustomPermissionGroupRepository {
    Flux<PermissionGroup> findAllByAssignedToGroupIdsIn(Set<String> groupIds);

    Flux<PermissionGroup> findAllByAssignedToUserIdsIn(Set<String> userIds);
}
