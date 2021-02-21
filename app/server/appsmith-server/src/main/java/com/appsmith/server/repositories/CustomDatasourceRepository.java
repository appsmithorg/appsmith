package com.appsmith.server.repositories;

import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Datasource;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomDatasourceRepository extends AppsmithRepository<Datasource> {
    Flux<Datasource> findAllByOrganizationId(String organizationId, AclPermission permission);

    Mono<Datasource> findByName(String name, AclPermission aclPermission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

    Flux<Datasource> findAllByIds(Set<String> ids, AclPermission permission);

    Mono<UpdateResult> saveStructure(String datasourceId, DatasourceStructure structure);

}
