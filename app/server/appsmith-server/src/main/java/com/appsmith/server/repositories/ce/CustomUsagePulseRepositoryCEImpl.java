package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomUsagePulseRepositoryCEImpl extends BaseAppsmithRepositoryImpl<UsagePulse> implements CustomUsagePulseRepositoryCE {

    public CustomUsagePulseRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

}
