package com.appsmith.server.repositories.ce;


import com.appsmith.server.domains.RbacPolicy;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomRbacPolicyRepositoryCEImpl extends BaseAppsmithRepositoryImpl<RbacPolicy> implements CustomRbacPolicyRepositoryCE {

    public CustomRbacPolicyRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
