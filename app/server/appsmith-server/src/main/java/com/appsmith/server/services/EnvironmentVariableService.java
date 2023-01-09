package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.services.ce.EnvironmentVariableServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface EnvironmentVariableService extends EnvironmentVariableServiceCE {
    // Read methods for access with different criteria.

    Mono<EnvironmentVariable> findById(String id, AclPermission aclPermission);

    Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission);

    Flux<EnvironmentVariable> findByEnvironmentId(String envId, AclPermission aclPermission);

    Flux<EnvironmentVariable> findEnvironmentVariableByEnvironmentId(String environmentId);

    Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

    Flux<EnvironmentVariable> findEnvironmentVariableByWorkspaceId(String workspaceId);

    // Write methods used for creating new variables as well as updating variables.

    Mono<EnvironmentVariable> save(EnvironmentVariable envVariable);

    Flux<EnvironmentVariable> saveAll(List<EnvironmentVariable> envVariables);

    // Delete/Archive calls for environment variables

    Mono<EnvironmentVariable> archive(EnvironmentVariable envVariable);

    Mono<EnvironmentVariable> archiveById(String id, AclPermission aclPermission);

    Mono<Boolean> archiveAllById(List<String> ids);

    // Update calls for environment variables
    // currently not in use because of decrypting errors while updating.
    Mono<EnvironmentVariable> update(String id, EnvironmentVariable envVariable);

    Mono<EnvironmentVariable> updateById(String id, EnvironmentVariable environmentVariable, AclPermission aclPermission);

}
