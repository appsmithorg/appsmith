package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceRepository;

import java.util.List;
import java.util.Set;

public interface DatasourceRepositoryCE extends BaseRepository<Datasource, String>, CustomDatasourceRepository {
    List<IdPoliciesOnly> findIdsAndPolicyMapByIdIn(Set<String> datasourceIds);
}
