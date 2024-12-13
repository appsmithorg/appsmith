package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceStorageStructureRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DatasourceStorageStructureRepositoryCE
        extends BaseRepository<DatasourceStorageStructure, String>, CustomDatasourceStorageStructureRepository {}
