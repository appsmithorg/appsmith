package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.Set;

@Repository
public interface DatasourceRepositoryCE extends BaseRepository<Datasource, String>, CustomDatasourceRepository {
    Flux<IdPoliciesOnly> findIdsAndPolicyMapByIdIn(Set<String> datasourceIds);
}
