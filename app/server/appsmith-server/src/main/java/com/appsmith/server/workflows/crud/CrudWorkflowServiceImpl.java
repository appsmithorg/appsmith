package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QWorkflow;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ObjectUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.workflows.helpers.WorkflowHelper;
import com.appsmith.server.workflows.permission.WorkflowPermission;
import jakarta.validation.Validator;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
public class CrudWorkflowServiceImpl extends CrudWorkflowServiceCECompatibleImpl implements CrudWorkflowService {

    private final DatasourceService datasourceService;
    private final NewActionService newActionService;
    private final SessionUserService sessionUserService;
    private final WorkspaceService workspaceService;
    private final PolicyGenerator policyGenerator;
    private final WorkflowHelper workflowHelper;
    private final ActionPermission actionPermission;
    private final DatasourcePermission datasourcePermission;
    private final WorkflowPermission workflowPermission;
    private final WorkspacePermission workspacePermission;

    public CrudWorkflowServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService,
            DatasourceService datasourceService,
            NewActionService newActionService,
            WorkspaceService workspaceService,
            SessionUserService sessionUserService,
            PolicyGenerator policyGenerator,
            WorkflowHelper workflowHelper,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission,
            WorkflowPermission workflowPermission,
            WorkspacePermission workspacePermission) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.datasourceService = datasourceService;
        this.newActionService = newActionService;
        this.sessionUserService = sessionUserService;
        this.workspaceService = workspaceService;
        this.policyGenerator = policyGenerator;
        this.workflowHelper = workflowHelper;
        this.actionPermission = actionPermission;
        this.datasourcePermission = datasourcePermission;
        this.workflowPermission = workflowPermission;
        this.workspacePermission = workspacePermission;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<Workflow> createWorkflow(Workflow resource, String workspaceId) {
        if (ValidationUtils.isEmptyParam(resource.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }
        if (ValidationUtils.isEmptyParam(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser().cache();

        return workspaceService
                .findById(workspaceId, workspacePermission.getWorkflowCreatePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE_ID, workspaceId)))
                .zipWith(userMono)
                .flatMap(tuple2 -> {
                    Workspace workspace = tuple2.getT1();
                    User currentUser = tuple2.getT2();
                    resource.setWorkspaceId(workspace.getId());

                    Set<Policy> policies = policyGenerator.getAllChildPolicies(
                            workspace.getPolicies(), Workspace.class, Workflow.class);
                    resource.setPolicies(policies);
                    resource.setModifiedBy(currentUser.getUsername());

                    return createSuffixedWorkflow(resource, resource.getName(), 0);
                });
    }

    private Mono<Workflow> createSuffixedWorkflow(Workflow workflow, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        workflow.setName(actualName);
        workflow.setSlug(TextUtils.makeSlug(workflow.getName()));
        workflow.setLastEditedAt(Instant.now());
        if (!StringUtils.hasLength(workflow.getColor())) {
            workflow.setColor(getRandomWorkflowCardColor());
        }

        return repository
                .save(workflow)
                .flatMap(repository::setUserPermissionsInObject)
                .onErrorResume(DuplicateKeyException.class, error -> {
                    if (error.getMessage() != null && error.getMessage().contains("ws_pkg_name_deleted_at_uindex")) {
                        if (suffix > 5) {
                            return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY_PAGE_RELOAD, name));
                        } else {
                            return createSuffixedWorkflow(workflow, name, suffix + 1);
                        }
                    }
                    throw error;
                });
    }

    public String getRandomWorkflowCardColor() {
        int randomColorIndex = (int) (System.currentTimeMillis() % ApplicationConstants.APP_CARD_COLORS.length);
        return ApplicationConstants.APP_CARD_COLORS[randomColorIndex];
    }

    /**
     * <p>
     * Updates a workflow with the provided changes, considering selective fields, and optionally updates associated
     * workflow bot role and user details.
     * </p>
     *
     * <p>
     * The update process involves the following steps:
     * <ol>
     *   <li>Retrieves the current user making the update.</li>
     *   <li>Fetches the existing workflow based on the provided workflow ID, with edit permissions checked.</li>
     *   <li>If the workflow is not found, an error with the corresponding ACL no-resource-found code is thrown.</li>
     *   <li>Creates an update object with selective fields from the provided workflow update.</li>
     *   <li>If no selective fields are present for update, returns the existing workflow without further changes.</li>
     *   <li>Sets the "updatedAt" field to the current timestamp and "modifiedBy" to the username of the current user.</li>
     *   <li>Updates the workflow in the repository and fetches the updated workflow.</li>
     *   <li>Combines the workflow before and after the update to process additional steps if necessary.</li>
     *   <li>Optionally updates the workflow bot role and user details if the workflow name in updateWorkflow is non-empty.</li>
     * </ol>
     * </p>
     *
     * @param workflowUpdate The workflow object containing the changes to be applied.
     * @param workflowId The ID of the workflow to be updated.
     * @return A Mono emitting the updated workflow after considering selective fields and performing any additional steps.
     *         The Mono will emit an error if the workflow is not found or if any part of the update process encounters an issue.
     * </p>
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<Workflow> updateWorkflow(Workflow workflowUpdate, String workflowId) {
        Mono<User> userMono = sessionUserService.getCurrentUser().cache();

        Mono<Workflow> workflowBeforeUpdateMono = repository
                .findById(workflowId, workflowPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKFLOW_ID, workflowId)))
                .cache();

        Mono<Workflow> updatedWorkflowMono = workflowBeforeUpdateMono
                .zipWith(userMono)
                .flatMap(tuple2 -> {
                    Workflow dbWorkflow = tuple2.getT1();
                    User currentUser = tuple2.getT2();

                    // Allow only selective paths to be updated using this API
                    Update updateObj = createUpdateObjectForSelectiveFields(workflowUpdate);

                    if (updateObj.getUpdateObject().isEmpty()) {
                        return Mono.just(dbWorkflow);
                    }
                    updateObj.set(fieldName(QWorkflow.workflow.updatedAt), Instant.now());
                    updateObj.set(fieldName(QWorkflow.workflow.modifiedBy), currentUser.getUsername());

                    return repository
                            .update(workflowId, updateObj, workflowPermission.getEditPermission())
                            .then(repository.findById(workflowId));
                })
                .cache();

        return Mono.zip(workflowBeforeUpdateMono, updatedWorkflowMono).flatMap(pair -> {
            Workflow actualWorkflow = pair.getT1();
            Workflow updatedWorkflow = pair.getT2();
            if (!StringUtils.hasLength(workflowUpdate.getName())) {
                return Mono.just(updatedWorkflow);
            }

            return workflowHelper
                    .updateWorkflowBotRoleAndUserDetails(actualWorkflow, updatedWorkflow)
                    .thenReturn(updatedWorkflow);
        });
    }

    private Update createUpdateObjectForSelectiveFields(Workflow workflowUpdate) {
        Update updateObj = new Update();
        String iconPath = fieldName(QWorkflow.workflow.icon);
        String colorPath = fieldName(QWorkflow.workflow.color);
        String namePath = fieldName(QWorkflow.workflow.name);

        ObjectUtils.setIfNotEmpty(updateObj, iconPath, workflowUpdate.getIcon());
        ObjectUtils.setIfNotEmpty(updateObj, colorPath, workflowUpdate.getColor());
        ObjectUtils.setIfNotEmpty(updateObj, namePath, workflowUpdate.getName());

        return updateObj;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Flux<Workflow> getAllWorkflows(String workspaceId) {
        return repository.findAllByWorkspaceId(
                workspaceId, Optional.ofNullable(workflowPermission.getReadPermission()));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<Workflow> getWorkflowById(String workflowId) {
        return repository
                .findById(workflowId, workflowPermission.getReadPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKFLOW_ID, workflowId)));
    }

    /**
     * <p>
     * Deletes a workflow and associated resources in a reactive manner.
     * </p>
     *
     * <p>
     * Associated Resources
     * <ol>
     *     <li>JS Objects</li>
     *     <li>Datasource queries</li>
     *     <li>Workflow Bot User</li>
     *     <li>Workflow Bot Role</li>
     * </ol>
     * </p>
     *
     * <p>
     * This method performs the following actions:
     * <ol>
     *   <li>Retrieves the workflow to be deleted based on the provided workflow ID with delete permissions checked.</li>
     *   <li>If the workflow is not found, an error with the corresponding ACL no-resource-found code is thrown.</li>
     *   <li>Archives all associated actions by invoking <code>archiveActionsByWorkflowId()</code> from the new action service.</li>
     *   <li>TODO: Archives action collections as well.</li>
     *   <li>Deletes the workflow bot role and user associated with the workflow.</li>
     *   <li>Combines the results of archiving the workflow bot role and user and archiving associated actions.</li>
     *   <li>Archives the workflow itself in the repository and returns the archived workflow.</li>
     * </ol>
     * </p>
     *
     * @param workflowId The ID of the workflow to be deleted.
     * @return A Mono emitting the archived workflow after deleting associated resources.
     *         The Mono will emit an error if the workflow is not found or if any part of the delete process encounters an issue.
     * </p>
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<Workflow> deleteWorkflow(String workflowId) {
        return repository
                .findById(workflowId, workflowPermission.getDeletePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKFLOW_ID, workflowId)))
                .flatMap(workflowToDelete -> {
                    // Archive all Actions.
                    Mono<List<NewAction>> archiveActionsByWorkflowIdMono = newActionService.archiveActionsByWorkflowId(
                            workflowToDelete.getId(), Optional.of(actionPermission.getDeletePermission()));
                    // TODO: Archive action collections as well.

                    // Delete the Workflow Bot User and Role.
                    Mono<Boolean> archiveWorkflowBotRoleAndUserMono =
                            workflowHelper.archiveWorkflowBotRoleAndUser(workflowToDelete);

                    return archiveWorkflowBotRoleAndUserMono
                            .then(archiveActionsByWorkflowIdMono)
                            .then(repository.archive(workflowToDelete).thenReturn(workflowToDelete));
                });
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
     * @param workflowId The ID of the workflow to which the action will be associated.
     * @param actionDTO The DTO containing information for creating the workflow action.
     * @return A Mono emitting the created action DTO after validation and saving to the repository.
     *         The Mono will emit an error if the workflow is not found, the datasource is not found, or if any part
     *         of the creation process encounters an issue.
     * </p>
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<ActionDTO> createWorkflowAction(String workflowId, ActionDTO actionDTO) {
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
        Set<Policy> workflowActionPolicies =
                policyGenerator.getAllChildPolicies(workflow.getPolicies(), Workflow.class, Action.class);
        workflowAction.setPolicies(workflowActionPolicies);
        return workflowAction;
    }
}
