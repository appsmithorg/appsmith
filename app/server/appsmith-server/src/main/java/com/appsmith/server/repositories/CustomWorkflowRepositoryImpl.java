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
        return queryBuilder().byId(id).permission(permission).updateFirst(updateObj);
    }

    @Override
    public Flux<Workflow> findAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission) {
        Criteria workspaceCriterion =
                Criteria.where(fieldName(QWorkflow.workflow.workspaceId)).is(workspaceId);

        return queryBuilder()
                .criteria(workspaceCriterion)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<Workflow> findAllById(
            List<String> workflowIds, Optional<AclPermission> permission, Optional<List<String>> includeFields) {
        Criteria workflowIdCriteria =
                Criteria.where(fieldName(QWorkflow.workflow.id)).in(workflowIds);
        return queryBuilder()
                .criteria(workflowIdCriteria)
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<Workflow> findAll(
            Optional<AclPermission> permission, Optional<List<String>> includeFields, Optional<Sort> sortBy) {
        return queryBuilder()
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null))
                .sort(sortBy.orElse(null))
                .all();
    }

    @Override
    public Mono<UpdateResult> updateGeneratedTokenForWorkflow(
            String workflowId, boolean tokenGenerated, Optional<AclPermission> aclPermission) {
        Update generatedTokenUpdate = new Update();
        generatedTokenUpdate.set(fieldName(QWorkflow.workflow.tokenGenerated), tokenGenerated);
        return queryBuilder()
                .byId(workflowId)
                .permission(aclPermission.orElse(null))
                .updateFirst(generatedTokenUpdate);
    }
}
