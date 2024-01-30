package com.appsmith.server.workflows.proxy;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.helpers.WorkflowProxyHelper;
import com.appsmith.server.workflows.permission.WorkflowPermission;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import static com.appsmith.server.constants.FieldName.WORKFLOW;

@Service
public class ProxyWorkflowServiceImpl extends ProxyWorkflowServiceCECompatibleImpl implements ProxyWorkflowService {

    private final WorkflowProxyHelper workflowProxyHelper;
    private final WorkflowPermission workflowPermission;

    public ProxyWorkflowServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService,
            WorkflowProxyHelper workflowProxyHelper,
            WorkflowPermission workflowPermission) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.workflowProxyHelper = workflowProxyHelper;
        this.workflowPermission = workflowPermission;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<JsonNode> getWorkflowRunActivities(String workflowId, String runId) {
        return findById(workflowId, workflowPermission.getReadHistoryPermission())
                .flatMap(workflow -> workflowProxyHelper.getWorkflowRunActivities(workflowId, runId));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<JsonNode> getWorkflowRuns(String workflowId, MultiValueMap<String, String> queryParams) {
        return findById(workflowId, workflowPermission.getReadHistoryPermission())
                .flatMap(workflow -> workflowProxyHelper.getWorkflowRuns(workflowId, queryParams));
    }

    private Mono<Workflow> findById(String id, AclPermission aclPermission) {
        return repository
                .findById(id, aclPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, WORKFLOW, id)));
    }
}
