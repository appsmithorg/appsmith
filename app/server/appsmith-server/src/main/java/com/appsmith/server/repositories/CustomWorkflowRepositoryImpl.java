package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QWorkflow;
import com.appsmith.server.domains.Workflow;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.domain.Sort;
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

    @Override
    public Flux<Workflow> findAllById(
            List<String> workflowIds, Optional<AclPermission> permission, Optional<List<String>> includeFields) {
        Criteria workflowIdCriteria =
                Criteria.where(fieldName(QWorkflow.workflow.id)).in(workflowIds);
        return queryAll(List.of(workflowIdCriteria), includeFields, permission, Optional.empty());
    }

    @Override
    public Flux<Workflow> findAll(
            Optional<AclPermission> permission, Optional<List<String>> includeFields, Optional<Sort> sortBy) {
        return queryAll(List.of(), includeFields, permission, sortBy);
    }

    @Override
    public Mono<UpdateResult> updateGeneratedTokenForWorkflow(
            String workflowId, boolean tokenGenerated, Optional<AclPermission> aclPermission) {
        Update generatedTokenUpdate = new Update();
        generatedTokenUpdate.set(fieldName(QWorkflow.workflow.tokenGenerated), tokenGenerated);
        return super.updateById(workflowId, generatedTokenUpdate, aclPermission);
    }
}
