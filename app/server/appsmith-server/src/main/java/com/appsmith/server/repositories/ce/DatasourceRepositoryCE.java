package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceRepository;

import java.util.List;
import java.util.Optional;

public interface DatasourceRepositoryCE extends BaseRepository<Datasource, String>, CustomDatasourceRepository {

    List<Datasource> findByIdIn(List<String> ids);

    List<Datasource> findAllByWorkspaceId(String workspaceId);

    Optional<Long> countByDeletedAtNull();
}
