package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomDatasourceStorageStructureRepositoryCEImpl;

public class CustomDatasourceStorageStructureRepositoryImpl extends CustomDatasourceStorageStructureRepositoryCEImpl
        implements CustomDatasourceStorageStructureRepository {
    public CustomDatasourceStorageStructureRepositoryImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
    }
}
