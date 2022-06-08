package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    public CustomPermissionGroupRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
