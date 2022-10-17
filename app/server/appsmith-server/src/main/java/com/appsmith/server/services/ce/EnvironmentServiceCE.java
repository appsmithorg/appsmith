package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.dtos.EnvironmentDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface EnvironmentServiceCE extends CrudService<Environment, String> {

    //Read
    Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

    Mono<Environment> findById(String id, AclPermission aclPermission);

    Mono<EnvironmentDTO> findEnvironmentByEnvironmentId(String envId);

    Flux<EnvironmentDTO> findEnvironmentByWorkspaceId(String workspaceId);

    //update --no update calls on CEServices

    //Create

    //Delete


    EnvironmentDTO createEnvironmentDTO(Environment environment);
}
