package com.appsmith.server.repositories;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.helpers.PolicyUtils;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomApiTemplateRepositoryImpl extends BaseAppsmithRepositoryImpl<ApiTemplate>
        implements CustomApiTemplateRepository {

    private final PolicyUtils policyUtils;

    public CustomApiTemplateRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter,
                                           PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }
}
