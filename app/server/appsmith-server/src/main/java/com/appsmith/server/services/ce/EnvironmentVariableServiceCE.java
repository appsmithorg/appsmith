package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;


public interface EnvironmentVariableServiceCE extends CrudService<EnvironmentVariable, String> {

    // Read

    Mono<EnvironmentVariable> findById(String id, AclPermission aclPermission);

    Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission);

    Flux<EnvironmentVariable> findByEnvironmentId(String envId, AclPermission aclPermission);

    Flux<EnvironmentVariable> findEnvironmentVariableByWorkspaceId(String workspaceId, AclPermission aclPermission);

    // Write

    Mono<EnvironmentVariable> save(EnvironmentVariable envVariable);

    Flux<EnvironmentVariable> saveAll(List<EnvironmentVariable> envVariables);

    // Delete/Archive

    Mono<EnvironmentVariable> archive(EnvironmentVariable envVariable);

    Mono<EnvironmentVariable> archiveById(String id);

    // Update
    Mono<EnvironmentVariable> update(String id, EnvironmentVariable envVariable);

}
