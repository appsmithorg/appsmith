package com.appsmith.server.repositories;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.helpers.PolicyUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomCollectionRepositoryImpl extends BaseAppsmithRepositoryImpl<Collection> implements CustomCollectionRepository {

    private final PolicyUtils policyUtils;

    @Autowired
    public CustomCollectionRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }
}
