package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomDatasourceRepositoryCE extends AppsmithRepository<Datasource> {

    Flux<Datasource> findAllByOrganizationId(String organizationId, AclPermission permission);

    Mono<Datasource> findByNameAndOrganizationId(String name, String organizationId, AclPermission aclPermission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

    Flux<Datasource> findAllByIds(Set<String> ids, AclPermission permission);

    Mono<UpdateResult> saveStructure(String datasourceId, DatasourceStructure structure);

}
