package com.appsmith.server.repositories;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

import static com.appsmith.server.constants.Constraint.NO_RECORD_LIMIT;

@Component
public class CustomActionCollectionRepositoryImpl extends CustomActionCollectionRepositoryCEImpl implements CustomActionCollectionRepository {

    public CustomActionCollectionRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields) {
        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).in(applicationIds);

        return queryAll(
                List.of(applicationCriteria),
                includeFields,
                null,
                null,
                NO_RECORD_LIMIT
        );
    }
}
