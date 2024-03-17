package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomCollectionRepositoryCEImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CustomCollectionRepositoryImpl extends CustomCollectionRepositoryCEImpl
        implements CustomCollectionRepository {

    @Autowired
    public CustomCollectionRepositoryImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
    }
}
