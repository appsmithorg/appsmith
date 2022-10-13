package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.domains.QEnvironmentVariable;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomEnvironmentVariableRepositoryCEImpl extends BaseAppsmithRepositoryImpl<EnvironmentVariable> implements CustomEnvironmentVariableRepositoryCE {

    @Autowired
    public CustomEnvironmentVariableRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }


    @Override
    public Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission) {
        Criteria idsCriterion = where(fieldName(QEnvironmentVariable.environmentVariable.id)).in(ids);

        return queryAll(List.of(idsCriterion), aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findByEnvironmentId(String envId, AclPermission aclPermission) {
        Criteria environmentIdCriteria = where(fieldName(QEnvironmentVariable.environmentVariable.environmentId)).is(envId);

        return queryAll(List.of(environmentIdCriteria), aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findNonDeletedVariablesByEnvironmentIds(List<String> envIds, AclPermission aclPermission) {
        Criteria environmentIdCriterion = where(fieldName(QEnvironmentVariable.environmentVariable.environmentId)).in(envIds);
        Criteria deleteCriteria = where(fieldName(QEnvironmentVariable.environmentVariable.deletedAt)).is(null);

        return queryAll(List.of(environmentIdCriterion, deleteCriteria), aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        Criteria environmentIdCriteria = where(fieldName(QEnvironmentVariable.environmentVariable.environmentId)).is(workspaceId);

        return queryAll(List.of(environmentIdCriteria), aclPermission);
    }


}
