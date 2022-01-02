package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomApiTemplateRepositoryCEImpl extends BaseAppsmithRepositoryImpl<ApiTemplate>
        implements CustomApiTemplateRepositoryCE {

    public CustomApiTemplateRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
