package com.appsmith.server.repositories;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

@Component
public class CustomActionCollectionRepositoryImpl extends CustomActionCollectionRepositoryCEImpl
        implements CustomActionCollectionRepository {

    public CustomActionCollectionRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<ActionCollection> findAllByModuleIds(List<String> moduleIds, List<String> includeFields) {
        Criteria moduleIdCriteria = Criteria.where(
                        fieldName(QActionCollection.actionCollection.unpublishedCollection.moduleId))
                .in(moduleIds);
        return queryAll(List.of(moduleIdCriteria), includeFields, null, null, NO_RECORD_LIMIT);
    }
}
