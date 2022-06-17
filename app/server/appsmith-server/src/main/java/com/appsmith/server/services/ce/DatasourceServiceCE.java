package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface DatasourceServiceCE extends CrudService<Datasource, String> {

    Mono<DatasourceTestResult> testDatasource(Datasource datasource);

    Mono<Datasource> findByNameAndOrganizationId(String name, String organizationId, AclPermission permission);

    Mono<Datasource> findById(String id, AclPermission aclPermission);

    Mono<Datasource> findById(String id);

    Set<String> extractKeysFromDatasource(Datasource datasource);

    Mono<Datasource> validateDatasource(Datasource datasource);

    Mono<Datasource> save(Datasource datasource);

    Flux<Datasource> findAllByOrganizationId(String organizationId, AclPermission readDatasources);

    Flux<Datasource> saveAll(List<Datasource> datasourceList);

    Mono<Datasource> populateHintMessages(Datasource datasource);
}
