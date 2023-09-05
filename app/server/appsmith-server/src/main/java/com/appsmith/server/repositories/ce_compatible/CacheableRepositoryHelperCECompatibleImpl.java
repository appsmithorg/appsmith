package com.appsmith.server.repositories.ce_compatible;

import com.appsmith.server.repositories.ce.CacheableRepositoryHelperCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CacheableRepositoryHelperCECompatibleImpl extends CacheableRepositoryHelperCEImpl
        implements CacheableRepositoryHelperCECompatible {
    public CacheableRepositoryHelperCECompatibleImpl(ReactiveMongoOperations mongoOperations) {
        super(mongoOperations);
    }
}
