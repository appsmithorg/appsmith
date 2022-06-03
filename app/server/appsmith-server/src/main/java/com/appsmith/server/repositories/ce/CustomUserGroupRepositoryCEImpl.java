package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomUserGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<UserGroup>
        implements CustomUserGroupRepositoryCE {

    public CustomUserGroupRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
