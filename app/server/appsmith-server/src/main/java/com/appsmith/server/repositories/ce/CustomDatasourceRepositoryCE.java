package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomDatasourceRepositoryCE extends AppsmithRepository<Datasource> {

    Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission);

    Flux<Datasource> findAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

    Flux<Datasource> findAllByIds(Set<String> ids, AclPermission permission);

    Flux<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields);
}
