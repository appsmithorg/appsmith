package com.appsmith.server.repositories;

import com.appsmith.server.domains.Permission;
import com.appsmith.server.helpers.PolicyUtils;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomPermissionRepositoryImpl extends BaseAppsmithRepositoryImpl<Permission>
        implements CustomPermissionRepository {

    private final PolicyUtils policyUtils;

    public CustomPermissionRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }
}
