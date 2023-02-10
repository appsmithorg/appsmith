package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CacheableRepositoryUtilCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CacheableRepositoryUtilImpl extends CacheableRepositoryUtilCEImpl implements CacheableRepositoryUtil {
    public CacheableRepositoryUtilImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
    }
}

