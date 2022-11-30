package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomApplicationRepositoryCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomApplicationRepositoryImpl extends CustomApplicationRepositoryCEImpl
        implements CustomApplicationRepository {

    @Autowired
    public CustomApplicationRepositoryImpl(@NonNull ReactiveMongoOperations mongoOperations,
                                           @NonNull MongoConverter mongoConverter,
                                           CacheableRepositoryHelper cacheableRepositoryHelper,
                                           ApplicationPermission applicationPermission) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper, applicationPermission);
    }

}
