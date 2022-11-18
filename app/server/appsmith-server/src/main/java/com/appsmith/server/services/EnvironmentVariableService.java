package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.services.ce.EnvironmentVariableServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface EnvironmentVariableService extends EnvironmentVariableServiceCE {
    // Read

    Mono<EnvironmentVariable> findById(String id, AclPermission aclPermission);

    Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission);

    Flux<EnvironmentVariable> findByEnvironmentId(String envId, AclPermission aclPermission);

    Flux<EnvironmentVariable> findEnvironmentVariableByEnvironmentId(String environmentId);

    Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

    Flux<EnvironmentVariable> findEnvironmentVariableByWorkspaceId(String workspaceId);

    // Write

    Mono<EnvironmentVariable> save(EnvironmentVariable envVariable);

    Flux<EnvironmentVariable> saveAll(List<EnvironmentVariable> envVariables);

    // Delete/Archive

    Mono<EnvironmentVariable> archive(EnvironmentVariable envVariable);

    Mono<EnvironmentVariable> archiveById(String id, AclPermission aclPermission);

    // Update
    Mono<EnvironmentVariable> update(String id, EnvironmentVariable envVariable);

    Mono<EnvironmentVariable> updateById(String id, EnvironmentVariable environmentVariable, AclPermission aclPermission);

}
