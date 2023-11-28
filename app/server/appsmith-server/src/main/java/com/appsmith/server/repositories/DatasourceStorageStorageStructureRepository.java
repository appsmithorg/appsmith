package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.DatasourceStorageStorageStructureRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface DatasourceStorageStorageStructureRepository
        extends DatasourceStorageStorageStructureRepositoryCE, CustomDatasourceStorageStructureRepository {}
