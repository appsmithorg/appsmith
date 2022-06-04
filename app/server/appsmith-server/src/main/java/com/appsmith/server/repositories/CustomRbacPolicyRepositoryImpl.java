package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomRbacPolicyRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomRbacPolicyRepositoryImpl extends CustomRbacPolicyRepositoryCEImpl implements CustomRbacPolicyRepository {

    public CustomRbacPolicyRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
