package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Permission;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomPermissionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Permission>
        implements CustomPermissionRepositoryCE {

    public CustomPermissionRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
