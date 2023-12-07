package com.appsmith.server.workflows.proxy;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.QWorkflow;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.helpers.WorkflowProxyHelper;
import jakarta.validation.Validator;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static com.appsmith.server.acl.AclPermission.READ_HISTORY_WORKFLOWS;
import static com.appsmith.server.constants.FieldName.WORKFLOW;
import static com.appsmith.server.constants.QueryParams.FILTER_DELIMITER;
import static com.appsmith.server.constants.QueryParams.WORKFLOW_ID;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
public class ProxyWorkflowServiceImpl extends ProxyWorkflowServiceCECompatibleImpl implements ProxyWorkflowService {

    private final WorkflowProxyHelper workflowProxyHelper;

    public ProxyWorkflowServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService,
            WorkflowProxyHelper workflowProxyHelper) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.workflowProxyHelper = workflowProxyHelper;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<JSONObject> getWorkflowHistory(MultiValueMap<String, String> filters) {
        return validateAccessToWorkflowsAndUpdateWorkflowIds(filters).flatMap(sanitisedFilters -> {
            if (sanitisedFilters.containsKey(WORKFLOW_ID)
                    && StringUtils.isNotEmpty(sanitisedFilters.getFirst(WORKFLOW_ID))) {
                return workflowProxyHelper.getWorkflowHistoryFromProxySource(sanitisedFilters);
            }
            return Mono.just(new JSONObject());
        });
    }

    private Mono<MultiValueMap<String, String>> validateAccessToWorkflowsAndUpdateWorkflowIds(
            MultiValueMap<String, String> filters) {
        List<String> includeFields = List.of(fieldName(QWorkflow.workflow.id));
        Mono<List<String>> workflowIdsMono;
        // Workflow Ids are sent.
        if (filters.containsKey(WORKFLOW_ID) && StringUtils.isNotEmpty(filters.getFirst(WORKFLOW_ID))) {
            List<String> workflowIdsProvided = Arrays.stream(
                            filters.getFirst(WORKFLOW_ID).split(FILTER_DELIMITER))
                    .toList();
            workflowIdsMono = repository
                    .findAllById(workflowIdsProvided, Optional.of(READ_HISTORY_WORKFLOWS), Optional.of(includeFields))
                    .map(Workflow::getId)
                    .collectList();
        }
        // No workflow Ids are sent.
        else {
            workflowIdsMono = repository
                    .findAll(Optional.of(READ_HISTORY_WORKFLOWS), Optional.of(includeFields), Optional.empty())
                    .map(Workflow::getId)
                    .collectList();
        }
        return workflowIdsMono.map(readableWorkflowIds -> sanitiseFiltersWithWorkflowId(filters, readableWorkflowIds));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<JSONObject> getWorkflowHistoryByWorkflowId(String id, MultiValueMap<String, String> filters) {
        Mono<Workflow> workflowMono = repository
                .findById(id, READ_HISTORY_WORKFLOWS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, WORKFLOW, id)));
        return workflowMono.flatMap(workflow -> {
            MultiValueMap<String, String> updatedFilters = sanitiseFiltersWithWorkflowId(filters, List.of(id));
            return workflowProxyHelper.getWorkflowHistoryFromProxySource(updatedFilters);
        });
    }

    private MultiValueMap<String, String> sanitiseFiltersWithWorkflowId(
            MultiValueMap<String, String> filters, List<String> workflowIds) {
        MultiValueMap<String, String> updatedFilters = new LinkedMultiValueMap<>();
        updatedFilters.addAll(filters);
        updatedFilters.remove(WORKFLOW_ID);
        updatedFilters.add(WORKFLOW_ID, String.join(FILTER_DELIMITER, workflowIds));
        return updatedFilters;
    }
}
