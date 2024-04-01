package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;

public class CustomDatasourceStorageRepositoryCEImpl extends BaseAppsmithRepositoryImpl<DatasourceStorage>
        implements CustomDatasourceStorageRepositoryCE {

    public CustomDatasourceStorageRepositoryCEImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
    }
}
