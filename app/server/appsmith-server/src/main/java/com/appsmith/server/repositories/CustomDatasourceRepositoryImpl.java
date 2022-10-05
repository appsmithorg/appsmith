package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.ce.CustomDatasourceRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.constants.Constraint.NO_RECORD_LIMIT;

@Component
public class CustomDatasourceRepositoryImpl extends CustomDatasourceRepositoryCEImpl implements CustomDatasourceRepository {

    public CustomDatasourceRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Datasource> findAllByWorkspaceIdsWithoutPermission(Set<String> workspaceIds, List<String> includeFields) {
        Criteria workspaceCriteria = Criteria.where(FieldName.WORKSPACE_ID).in(workspaceIds);

        return queryAll(
                List.of(workspaceCriteria),
                includeFields,
                null,
                null,
                NO_RECORD_LIMIT
        );
    }

}
