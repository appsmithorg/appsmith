package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.repositories.ce.CustomEnvironmentVariableRepositoryCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomEnvironmentVariableRepository extends CustomEnvironmentVariableRepositoryCE {
    Mono<EnvironmentVariable> findById(String id, AclPermission aclPermission);

    Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission);

    Flux<EnvironmentVariable> findByEnvironmentId(String envId, AclPermission aclPermission);

    Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

}
