package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.dtos.EnvironmentDTO;
import com.appsmith.server.services.ce .EnvironmentServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface EnvironmentService extends EnvironmentServiceCE {
    //Read
    Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

    Mono<Environment> findById(String id, AclPermission aclPermission);

    Mono<EnvironmentDTO> findEnvironmentByEnvironmentId(String envId);

    Flux<EnvironmentDTO> findEnvironmentByWorkspaceId(String workspaceId);

    //update --

    Flux<EnvironmentDTO> updateEnvironment(List<EnvironmentDTO> environmentDTOList);

    //Create
    Mono<Environment> save(Environment environment);

    //Delete


    EnvironmentDTO createEnvironmentDTO(Environment environment);

    Mono<EnvironmentDTO> createNewEnvironment(EnvironmentDTO environmentDTO);


}
