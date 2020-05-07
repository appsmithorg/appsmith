package com.appsmith.server.repositories;

import com.appsmith.external.models.Provider;
import com.appsmith.server.helpers.PolicyUtils;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomProviderRepositoryImpl extends BaseAppsmithRepositoryImpl<Provider> implements CustomProviderRepository {

    private final PolicyUtils policyUtils;

    public CustomProviderRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }
}
