package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.beans.factory.annotation.Autowired;

public class CustomCollectionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Collection>
        implements CustomCollectionRepositoryCE {

    @Autowired
    public CustomCollectionRepositoryCEImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
    }
}
