package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Datasource;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomDatasourceRepository extends AppsmithRepository<Datasource> {
    Flux<Datasource> findAllByOrganizationId(String organizationId, AclPermission permission);

    Mono<Datasource> findByName(String name, AclPermission aclPermission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

}
