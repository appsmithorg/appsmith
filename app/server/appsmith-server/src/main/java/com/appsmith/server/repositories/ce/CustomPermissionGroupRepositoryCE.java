/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import java.util.Set;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomPermissionGroupRepositoryCE extends AppsmithRepository<PermissionGroup> {

  Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
      String userId, String workspaceId, AclPermission permission);

  Mono<UpdateResult> updateById(String id, Update updateObj);

  Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission);

  Flux<PermissionGroup> findByDefaultWorkspaceIds(
      Set<String> workspaceIds, AclPermission permission);

  Mono<Void> evictPermissionGroupsUser(String email, String tenantId);

  Mono<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId);
}
