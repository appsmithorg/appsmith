package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomDatasourceRepositoryCE extends AppsmithRepository<Datasource> {

    Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission);

    Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission);

    Flux<Datasource> findByIdIn(List<String> ids);

    Mono<Long> countByDeletedAtNull();
}
