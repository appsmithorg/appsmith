package com.appsmith.server.repositories;

import com.appsmith.external.models.Environment;
import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.ce.CustomEnvironmentRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomEnvironmentRepositoryImpl extends CustomEnvironmentRepositoryCEImpl
        implements CustomEnvironmentRepository {

    @Autowired
    public CustomEnvironmentRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    private static Criteria environmentIdCriteria(String environmentId) {
        return where(fieldName(QEnvironment.environment.id)).is(environmentId);
    }

    private static Criteria workspaceIdCriteria(String workspaceId) {
        return where(fieldName(QEnvironment.environment.workspaceId)).is(workspaceId);
    }

    private static Criteria nameCriteria(String name) {
        return where(fieldName(QEnvironment.environment.name)).is(name);
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        List<Criteria> criterias = List.of(workspaceIdCriteria(workspaceId));
        return queryBuilder()
                .criteria(criterias)
                .permission(aclPermission)
                .all()
                .flatMap(this::setUserPermissionsInObject);
    }

    @Override
    public Mono<Environment> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(notDeleted(), workspaceIdCriteria(workspaceId), nameCriteria(name))
                .permission(aclPermission)
                .one();
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId) {
        return queryBuilder()
                .criteria(workspaceIdCriteria(workspaceId), notDeleted())
                .all();
    }

    @Override
    public Mono<Environment> findByNameAndWorkspaceId(String name, String workspaceId) {
        return queryBuilder()
                .criteria(notDeleted(), workspaceIdCriteria(workspaceId), nameCriteria(name))
                .one();
    }

    @Override
    public Flux<Environment> findAllByWorkspaceIdsWithoutPermission(
            Set<String> workspaceIds, List<String> includeFields) {
        Criteria workspaceCriteria = Criteria.where(FieldName.WORKSPACE_ID).in(workspaceIds);

        return queryBuilder().criteria(workspaceCriteria).fields(includeFields).all();
    }
}
