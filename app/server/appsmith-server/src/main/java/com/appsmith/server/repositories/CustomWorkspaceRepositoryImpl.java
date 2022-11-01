package com.appsmith.server.repositories;

import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.ce.CustomWorkspaceRepositoryCEImpl;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

@Component
@Slf4j
public class CustomWorkspaceRepositoryImpl extends CustomWorkspaceRepositoryCEImpl
        implements CustomWorkspaceRepository {

    public CustomWorkspaceRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter,
            SessionUserService sessionUserService, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, sessionUserService, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Workspace> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields) {
        return queryAll(
                List.of(Criteria.where(fieldName(QWorkspace.workspace.tenantId)).is(tenantId)),
                includeFields,
                null,
                null
        );
    }


}
