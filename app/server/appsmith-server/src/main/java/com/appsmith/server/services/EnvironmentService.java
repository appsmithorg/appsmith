package com.appsmith.server.services;

import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.services.ce_compatible.EnvironmentServiceCECompatible;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Optional;

public interface EnvironmentService extends EnvironmentServiceCECompatible {
    // Read methods to fetch environments and its variables.

    Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

    Flux<Environment> findByWorkspaceId(String workspaceId);

    Mono<Environment> findById(String id, Optional<AclPermission> aclPermission);

    Mono<Environment> findById(String id);

    Flux<Environment> createDefaultEnvironments(Workspace createdWorkspace);

    Flux<Environment> archiveByWorkspaceId(String workspaceId);
}
