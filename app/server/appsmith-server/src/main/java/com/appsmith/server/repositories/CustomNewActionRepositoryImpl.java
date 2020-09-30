package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewAction;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomNewActionRepositoryImpl extends BaseAppsmithRepositoryImpl<NewAction>
        implements CustomNewActionRepository {

    public CustomNewActionRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                         MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
