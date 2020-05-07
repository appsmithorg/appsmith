package com.appsmith.server.repositories;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.PolicyUtils;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomPluginRepositoryImpl extends BaseAppsmithRepositoryImpl<Plugin> implements CustomPluginRepository {

    private final PolicyUtils policyUtils;

    public CustomPluginRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }
}
