package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.ConfigurationStorage;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomConfigurationStorageRepository;

public interface ConfigurationStorageRepositoryCE extends BaseRepository<ConfigurationStorage, String>,
        CustomConfigurationStorageRepository {
}
