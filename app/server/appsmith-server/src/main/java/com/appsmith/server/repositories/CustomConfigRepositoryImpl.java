package com.appsmith.server.repositories;

import com.appsmith.server.domains.Config;
import com.appsmith.server.helpers.PolicyUtils;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomConfigRepositoryImpl extends BaseAppsmithRepositoryImpl<Config> implements CustomConfigRepository {

    private final PolicyUtils policyUtils;

    public CustomConfigRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }
}
