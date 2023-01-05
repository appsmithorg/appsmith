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
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@Slf4j
public class CustomEnvironmentRepositoryImpl extends CustomEnvironmentRepositoryCEImpl
        implements CustomEnvironmentRepository {

    @Autowired
    public CustomEnvironmentRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }


    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        Criteria workspaceCriteria  =  Criteria.where(fieldName(QEnvironment.environment.workspaceId)).is(workspaceId);
        return queryAll(List.of(workspaceCriteria), aclPermission);
    }

    @Override
    public Mono<Environment> findById(String id, AclPermission aclPermission) {
        return super.findById(id, aclPermission);
    }

}
