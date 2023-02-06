package com.appsmith.server.repositories;

import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.Environment;
import com.appsmith.server.repositories.ce.CustomEnvironmentRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomEnvironmentRepositoryImpl extends CustomEnvironmentRepositoryCEImpl
        implements CustomEnvironmentRepository {

    @Autowired
    public CustomEnvironmentRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
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

    private Flux<Environment> queryMany(List<Criteria> criterion) {
        Query query = new Query();
        for (Criteria criteria: criterion) {
            query.addCriteria(criteria);
        }
        return mongoOperations.find(query, Environment.class);
    }

    private Mono<Environment> queryOne(List<Criteria> criterion) {
        Query query = new Query();
        for (Criteria criteria: criterion) {
            query.addCriteria(criteria);
        }
        return mongoOperations.findOne(query, Environment.class);
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        return queryAll(List.of(workspaceIdCriteria(workspaceId)), aclPermission);
    }

    @Override
    public Mono<Environment> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        return queryOne(List.of(notDeleted(),
                                workspaceIdCriteria(workspaceId),
                                nameCriteria(name)),
                        aclPermission);
    }

    @Override
    public Mono<Environment> findById(String environmentId) {
        return queryOne(List.of(environmentIdCriteria(environmentId)));
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId) {
        return queryMany(List.of(
                workspaceIdCriteria(workspaceId),
                notDeleted()));
    }

    @Override
    public Mono<Environment> findByNameAndWorkspaceId(String name, String workspaceId) {
        return queryOne(List.of(
                notDeleted(),
                workspaceIdCriteria(workspaceId),
                nameCriteria(name)));
    }
}
