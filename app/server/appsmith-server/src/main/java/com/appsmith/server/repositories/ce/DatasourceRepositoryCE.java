package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.projections.IdPoliciesOnly;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface DatasourceRepositoryCE extends BaseRepository<Datasource, String>, CustomDatasourceRepository {

    List<Datasource> findByIdIn(List<String> ids, EntityManager entityManager);

    List<Datasource> findAllByWorkspaceId(String workspaceId, EntityManager entityManager);

    Optional<Long> countByDeletedAtNull(, EntityManager entityManager);

    List<IdPoliciesOnly> findIdsAndPolicyMapByIdIn(Set<String> datasourceIds, EntityManager entityManager);
}
