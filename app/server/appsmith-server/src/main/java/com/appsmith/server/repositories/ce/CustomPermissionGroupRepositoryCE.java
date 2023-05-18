package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomPermissionGroupRepositoryCE extends AppsmithRepository<PermissionGroup> {

    Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(String userId, String workspaceId, AclPermission permission);

    Mono<UpdateResult> updateById(String id, Update updateObj);

    Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission);

    Flux<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission);

    Mono<Void> evictPermissionGroupsUser(String email, String tenantId);
    Mono<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId);

}
