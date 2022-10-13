package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QEnvironment;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

import java.util.List;


@Slf4j
public class CustomEnvironmentRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Environment>
        implements CustomEnvironmentRepositoryCE {

    public CustomEnvironmentRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
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
