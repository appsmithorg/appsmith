package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.DatasourceConfigurationStorageRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface DatasourceConfigurationStorageRepository
        extends DatasourceConfigurationStorageRepositoryCE, CustomDatasourceConfigurationStorageRepository {
}
