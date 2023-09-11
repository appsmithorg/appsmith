package com.appsmith.server.repositories;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.repositories.ce.CustomNewPageRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

import static com.appsmith.server.constants.Constraint.NO_RECORD_LIMIT;

@Component
@Slf4j
public class CustomNewPageRepositoryImpl extends CustomNewPageRepositoryCEImpl implements CustomNewPageRepository {

    public CustomNewPageRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            MongoTemplate mongoTemplate) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper, mongoTemplate);
    }

    @Override
    public Flux<NewPage> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).in(applicationIds);
        return queryAll(List.of(applicationCriteria), includeFields, null, null, NO_RECORD_LIMIT);
    }
}
