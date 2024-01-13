package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.DatasourceStorageStructureRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface DatasourceStorageStructureRepository
        extends DatasourceStorageStructureRepositoryCE, CustomDatasourceStorageStructureRepository {}
