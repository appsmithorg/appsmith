package com.appsmith.server.repositories;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.QModuleInstance;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomModuleInstanceRepositoryImpl extends BaseAppsmithRepositoryImpl<ModuleInstance>
        implements CustomModuleInstanceRepository {

    public CustomModuleInstanceRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<Long> getModuleInstanceCountByModuleId(String moduleId) {
        Criteria moduleIdCriteria =
                where(fieldName(QModuleInstance.moduleInstance.moduleId)).is(moduleId);

        return count(List.of(moduleIdCriteria), Optional.empty());
    }
}
