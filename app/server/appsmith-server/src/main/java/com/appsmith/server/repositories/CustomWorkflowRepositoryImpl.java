package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QWorkflow;
import com.appsmith.server.domains.Workflow;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public class CustomWorkflowRepositoryImpl extends BaseAppsmithRepositoryImpl<Workflow>
        implements CustomWorkflowRepository {
    public CustomWorkflowRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission) {
        return updateById(id, updateObj, permission);
    }

    @Override
    public Flux<Workflow> findAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission) {
        Criteria workspaceCriterion =
                Criteria.where(fieldName(QWorkflow.workflow.workspaceId)).is(workspaceId);

        return queryAll(List.of(workspaceCriterion), permission);
    }
}
