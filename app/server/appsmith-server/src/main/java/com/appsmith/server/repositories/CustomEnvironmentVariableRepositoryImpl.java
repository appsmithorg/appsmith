package com.appsmith.server.repositories;

import com.appsmith.external.models.QEnvironmentVariable;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.server.repositories.ce.CustomEnvironmentVariableRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

@Component
@Slf4j
public class CustomEnvironmentVariableRepositoryImpl extends CustomEnvironmentVariableRepositoryCEImpl
        implements CustomEnvironmentVariableRepository {

    @Autowired
    public CustomEnvironmentVariableRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission) {
        Criteria idsCriterion = Criteria.where(fieldName(QEnvironmentVariable.environmentVariable.id)).in(ids);

        return queryAll(List.of(idsCriterion), aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findByEnvironmentId(String envId, AclPermission aclPermission) {
        Criteria environmentIdCriteria = Criteria.where(fieldName(QEnvironmentVariable.environmentVariable.environmentId)).is(envId);
        Criteria isDeletedCriteria = Criteria.where(fieldName(QEnvironmentVariable.environmentVariable.deletedAt)).is(null);

        return queryAll(List.of(environmentIdCriteria, isDeletedCriteria), aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        Criteria environmentIdCriteria = Criteria.where(fieldName(QEnvironmentVariable.environmentVariable.environmentId)).is(workspaceId);
        Criteria isDeletedCriteria = Criteria.where(fieldName(QEnvironmentVariable.environmentVariable.deletedAt)).is(null);

        return queryAll(List.of(environmentIdCriteria, isDeletedCriteria), aclPermission);
    }

}
