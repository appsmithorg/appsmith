package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.AppsmithRepository;

import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomPermissionGroupRepositoryCE extends AppsmithRepository<PermissionGroup> {

    Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(String userId, String workspaceId, AclPermission permission);

    Mono<UpdateResult> updateById(String id, Update updateObj);
}
