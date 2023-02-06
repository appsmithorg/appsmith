package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.Environment;
import com.appsmith.server.repositories.ce.CustomEnvironmentRepositoryCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomEnvironmentRepository extends CustomEnvironmentRepositoryCE {

    Flux<Environment> findByWorkspaceId(String workSpaceId, AclPermission aclPermission);
    Mono<Environment> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission);
    Mono<Environment> findById(String environmentId);
    Flux<Environment> findByWorkspaceId(String workspaceId);
    Mono<Environment> findByNameAndWorkspaceId(String name, String workspaceId);
}
