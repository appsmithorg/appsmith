package com.appsmith.server.repositories.ce;

import java.util.Set;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.repositories.AppsmithRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomUserGroupRepositoryCE extends AppsmithRepository<UserGroup> {

    Flux<UserGroup> findAllByIds(Set<String> ids, AclPermission permission);

    Flux<UserGroup> findAllByUserId(String userId, AclPermission permission);

    Flux<UserGroup> findAllByUserIdAndDefaultWorkspaceId(String userId, String defaultWorkspaceId, AclPermission permission);

    Mono<UserGroup> findByIdAndDefaultWorkspaceId(String id, String defaultWorkspaceId, AclPermission permission);

}
