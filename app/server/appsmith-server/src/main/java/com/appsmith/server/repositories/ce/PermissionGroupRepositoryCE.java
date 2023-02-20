package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPermissionGroupRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface PermissionGroupRepositoryCE extends BaseRepository<PermissionGroup, String>, CustomPermissionGroupRepository {

    Flux<PermissionGroup> findAllById(Set<String> ids);

    Mono<PermissionGroup> findById(String id, AclPermission permission);

    Flux<PermissionGroup> findByAssignedToUserIdsIn(String userId);

    Flux<PermissionGroup> findByDefaultWorkspaceId(String defaultWorkspaceId);
    Flux<PermissionGroup> findByDefaultDomainIdAndDefaultDomainType(String defaultDomainId, String domainType);

}
