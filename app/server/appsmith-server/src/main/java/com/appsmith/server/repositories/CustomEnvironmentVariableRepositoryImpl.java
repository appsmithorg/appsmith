package com.appsmith.server.repositories;

import com.appsmith.external.models.QEnvironmentVariable;
import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.ce.CustomEnvironmentVariableRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomEnvironmentVariableRepositoryImpl extends CustomEnvironmentVariableRepositoryCEImpl
        implements CustomEnvironmentVariableRepository {

    @Autowired
    public CustomEnvironmentVariableRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    private static Criteria workspaceIdCriteria(String workspaceId) {
        return where(fieldName(QEnvironmentVariable.environmentVariable.workspaceId)).is(workspaceId);
    }

    private static Criteria environmentIdCriteria(String environmentId) {
        return where(fieldName(QEnvironmentVariable.environmentVariable.environmentId)).is(environmentId);
    }

    private static Criteria datasourceIdCriteria(String datasourceId) {
        return where(fieldName(QEnvironmentVariable.environmentVariable.datasourceId)).is(datasourceId);
    }

    private static Criteria idCriteria(String envVarId) {
        return where(fieldName(QEnvironmentVariable.environmentVariable.id)).is(envVarId);
    }

    private static Criteria idsCriterion(List<String> ids) {
        return where(fieldName(QEnvironmentVariable.environmentVariable.id)).in(ids);
    }

    private static Criteria nameCriteria(String name) {
        return where(fieldName(QEnvironmentVariable.environmentVariable.name)).is(name);
    }

    private static Criteria namesCriterion(List<String> nameList) {
        return where(fieldName(QEnvironmentVariable.environmentVariable.name)).in(nameList);
    }

    private Flux<EnvironmentVariable> queryMany(List<Criteria> criterion) {
        Query query = new Query();
        for (Criteria criteria: criterion) {
            query.addCriteria(criteria);
        }
        return mongoOperations.find(query, EnvironmentVariable.class);
    }

    private Mono<EnvironmentVariable> queryOne(List<Criteria> criterion) {
        Query query = new Query();
        for (Criteria criteria: criterion) {
            query.addCriteria(criteria);
        }
        return mongoOperations.findOne(query, EnvironmentVariable.class);
    }

    @Override
    public Flux<EnvironmentVariable> findAllByIds(List<String> ids) {
        // since we are finding by ids, we will also allow archived variables
        return queryMany(List.of(idsCriterion(ids)));
    }

    @Override
    public Flux<EnvironmentVariable> findByEnvironmentId(String envId) {
        return queryMany(List.of(notDeleted(), environmentIdCriteria(envId)));
    }

    @Override
    public Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId) {
        return queryMany(List.of(notDeleted(), workspaceIdCriteria(workspaceId)));
    }

    @Override
    public Flux<EnvironmentVariable> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return queryMany(List.of(notDeleted(),
                                 environmentIdCriteria(environmentId),
                                 datasourceIdCriteria(datasourceId)));
    }

    @Override
    public Flux<EnvironmentVariable> findByNameAndWorkspaceId(List<String> envVarNameList, String workspaceId) {
        return queryMany(List.of(notDeleted(),
                                 workspaceIdCriteria(workspaceId),
                                 namesCriterion(envVarNameList)));
    }

    @Override
    public Flux<EnvironmentVariable> findByEnvironmentIdAndVariableNames(String environmentId, List<String> envVarNames) {
        return queryMany(List.of(notDeleted(),
                                 environmentIdCriteria(environmentId),
                                 namesCriterion(envVarNames)));
    }

    @Override
    public Mono<EnvironmentVariable>  archiveByNameAndEnvironmentId(EnvironmentVariable envVar) {
        Query query = new Query()
                .addCriteria(notDeleted())
                .addCriteria(environmentIdCriteria(envVar.getEnvironmentId()))
                .addCriteria(nameCriteria(envVar.getName()));

        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());

        return mongoOperations
                .updateFirst(query, update, EnvironmentVariable.class)
                .flatMap(result ->result.getModifiedCount() > 0 ? Mono.just(envVar) : Mono.empty());
    }

    @Override
    public Mono<Long> archiveByDatasourceIdAndWorkspaceId(String datasourceId, String workspaceId) {

        Query query = new Query()
                .addCriteria(notDeleted())
                .addCriteria(workspaceIdCriteria(workspaceId))
                .addCriteria(datasourceIdCriteria(datasourceId));

        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return mongoOperations.updateMulti(query, update,EnvironmentVariable.class)
                .map(updateResult ->  updateResult.getModifiedCount());
    }


}
