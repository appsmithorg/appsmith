package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.workflows.permission.WorkflowPermission;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import java.util.Optional;
import java.util.Set;

@Service
public class CrudWorkflowEntityServiceImpl extends CrudWorkflowEntityServiceCECompatibleImpl
        implements CrudWorkflowEntityService {
    private final WorkflowPermission workflowPermission;
    private final NewActionService newActionService;
    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;
    private final ActionPermission actionPermission;
    private final PolicyGenerator policyGenerator;

    public CrudWorkflowEntityServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService,
            WorkflowPermission workflowPermission,
            NewActionService newActionService,
            DatasourceService datasourceService,
            DatasourcePermission datasourcePermission,
            ActionPermission actionPermission,
            PolicyGenerator policyGenerator) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.workflowPermission = workflowPermission;
        this.newActionService = newActionService;
        this.datasourceService = datasourceService;
        this.datasourcePermission = datasourcePermission;
        this.actionPermission = actionPermission;
        this.policyGenerator = policyGenerator;
    }

    /**
     * <p>
     * Creates a workflow action and associates it with the specified workflow in a reactive manner.
     * </p>
     *
     * <p>
     * This method performs the following actions:
     * <ol>
     *   <li>Retrieves the workflow based on the provided workflow ID with action creation permissions checked.</li>
     *   <li>If the workflow is not found, an error with the corresponding ACL no-resource-found code is thrown.</li>
     *   <li>Generates a workflow action using the provided actionDTO and the retrieved workflow.</li>
     *   <li>Validates and saves the workflow action to the repository using <code>validateAndSaveActionToRepository()</code> from the new action service.</li>
     *   <li>If the actionDTO's datasource is null or has no ID, returns the created action without further checks.</li>
     *   <li>Retrieves the datasource based on the datasource ID with action create permissions checked.</li>
     *   <li>If the datasource is not found, an error with the corresponding ACL no-resource-found code is thrown.</li>
     *   <li>Continues with the previously created action Mono, ensuring the action creation is dependent on datasource permissions.</li>
     * </ol>
     * </p>
     *
     * @param actionDTO The DTO containing information for creating the workflow action.
     * @param branchName The branch to create the Workflows.
     * @return A Mono emitting the created action DTO after validation and saving to the repository.
     *         The Mono will emit an error if the workflow is not found, the datasource is not found, or if any part
     *         of the creation process encounters an issue.
     * </p>
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<ActionDTO> createWorkflowAction(ActionDTO actionDTO, String branchName) {
        // branchName handling is left as a TODO for future git implementation for git connected for workflows

        String workflowId = actionDTO.getWorkflowId();
        if (!StringUtils.hasLength(workflowId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKFLOW_ID));
        }
        Mono<Workflow> workflowMono = repository
                .findById(workflowId, workflowPermission.getActionCreationPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKFLOW, workflowId)));

        Mono<ActionDTO> createActionMono = workflowMono.flatMap(workflow -> {
            NewAction workflowAction = generateWorkflowAction(workflow, actionDTO);
            return newActionService.validateAndSaveActionToRepository(workflowAction);
        });

        if (actionDTO.getDatasource() == null
                || !StringUtils.hasLength(actionDTO.getDatasource().getId())) {
            return createActionMono;
        }

        String datasourceId = actionDTO.getDatasource().getId();
        return datasourceService
                .findById(datasourceId, datasourcePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "datasource", datasourceId)))
                .then(createActionMono);
    }

    NewAction generateWorkflowAction(Workflow workflow, ActionDTO actionDTO) {
        actionDTO.setWorkspaceId(workflow.getWorkspaceId());
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setDefaultResources(new DefaultResources());
        actionDTO.setContextType(CreatorContextType.WORKFLOW);
        NewAction workflowAction = new NewAction();
        workflowAction.setWorkspaceId(workflow.getWorkspaceId());
        workflowAction.setUnpublishedAction(actionDTO);
        workflowAction.setDefaultResources(new DefaultResources());
        workflowAction.setPublishedAction(new ActionDTO());
        workflowAction.setWorkflowId(workflow.getId());
        Set<Policy> workflowActionPolicies =
                policyGenerator.getAllChildPolicies(workflow.getPolicies(), Workflow.class, Action.class);
        workflowAction.setPolicies(workflowActionPolicies);
        return workflowAction;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<ActionDTO> updateWorkflowAction(String actionId, ActionDTO actionDTO) {
        return newActionService
                .updateUnpublishedActionWithoutAnalytics(
                        actionId, actionDTO, Optional.of(actionPermission.getEditPermission()))
                .map(Tuple2::getT1);
    }
}
