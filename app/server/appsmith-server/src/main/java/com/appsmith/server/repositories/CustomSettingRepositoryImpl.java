package com.appsmith.server.repositories;

import com.appsmith.server.domains.Setting;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomSettingRepositoryImpl extends BaseAppsmithRepositoryImpl<Setting> implements CustomSettingRepository {

    public CustomSettingRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }
}
