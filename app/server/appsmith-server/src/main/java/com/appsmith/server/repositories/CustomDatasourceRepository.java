
package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.repositories.ce.CustomDatasourceRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Set;

public interface CustomDatasourceRepository extends CustomDatasourceRepositoryCE {

    Flux<Datasource> findAllByWorkspaceIdsWithoutPermission(Set<String> workspaceIds, List<String> includeFields);

    Flux<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields);
}
