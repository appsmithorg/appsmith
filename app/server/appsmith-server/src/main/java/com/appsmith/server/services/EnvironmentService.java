package com.appsmith.server.services;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.services.ce.EnvironmentServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface EnvironmentService extends EnvironmentServiceCE {
    //Read methods to fetch environments and its variables.
    Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

    Flux<Environment> findByWorkspaceId(String workspaceId);

    Mono<Environment> findById(String id, AclPermission aclPermission);
    Mono<Environment> findById(String id);

    Mono<EnvironmentDTO> getEnvironmentDTOByEnvironmentId(String envId);

    Flux<EnvironmentDTO> getEnvironmentDTOByWorkspaceId(String workspaceId);

    Flux<Environment> createDefaultEnvironments(Workspace createdWorkspace);

    Flux<Environment> archiveByWorkspaceId(String workspaceId);

    Mono<EnvironmentDTO> setEnvironmentToDefault(Map<String, String> defaultEnvironmentMap);
}
