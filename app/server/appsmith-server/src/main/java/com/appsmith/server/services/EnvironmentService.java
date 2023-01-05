package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.Environment;
import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.server.services.ce.EnvironmentServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface EnvironmentService extends EnvironmentServiceCE {
    //Read methods to fetch environments and its variables.
    Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

    Mono<Environment> findById(String id, AclPermission aclPermission);

    Mono<EnvironmentDTO> findEnvironmentByEnvironmentId(String envId);

    Flux<EnvironmentDTO> findEnvironmentByWorkspaceId(String workspaceId);

    //update methods for updating environments and environment variables

    Flux<EnvironmentDTO> updateEnvironment(List<EnvironmentDTO> environmentDTOList);

    //Create methods for generating/updating new environments
    Mono<Environment> save(Environment environment);

    EnvironmentDTO createEnvironmentDTO(Environment environment);

    Mono<EnvironmentDTO> createNewEnvironment(EnvironmentDTO environmentDTO);

}
