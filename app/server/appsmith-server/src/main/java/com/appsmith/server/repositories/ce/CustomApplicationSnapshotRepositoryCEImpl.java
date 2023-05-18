package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.QApplicationSnapshot;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

public class CustomApplicationSnapshotRepositoryCEImpl extends BaseAppsmithRepositoryImpl<ApplicationSnapshot>
        implements CustomApplicationSnapshotRepositoryCE {

    public CustomApplicationSnapshotRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<ApplicationSnapshot> findWithoutData(String applicationId) {
        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(
                Criteria.where(fieldName(QApplicationSnapshot.applicationSnapshot.applicationId)).is(applicationId)
        );
        criteriaList.add(
                Criteria.where(fieldName(QApplicationSnapshot.applicationSnapshot.chunkOrder)).is(1)
        );

        List<String> fieldNames = List.of(
                fieldName(QApplicationSnapshot.applicationSnapshot.applicationId),
                fieldName(QApplicationSnapshot.applicationSnapshot.chunkOrder),
                fieldName(QApplicationSnapshot.applicationSnapshot.createdAt),
                fieldName(QApplicationSnapshot.applicationSnapshot.updatedAt)
        );
        return queryOne(criteriaList, fieldNames);
    }
}
