package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.domains.EnvironmentVariable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomEnvironmentVariableRepositoryCE extends AppsmithRepository<EnvironmentVariable> {

    Mono<EnvironmentVariable> findById(String id, AclPermission aclPermission);


    Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission);

    Flux<EnvironmentVariable> findByEnvironmentId(String envId, AclPermission aclPermission);

    Flux<EnvironmentVariable> findNonDeletedVariablesByEnvironmentIds(List<String> envIds, AclPermission aclPermission);

    Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId, AclPermission aclPermission);
}
