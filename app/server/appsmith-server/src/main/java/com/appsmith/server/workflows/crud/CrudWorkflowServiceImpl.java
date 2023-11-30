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
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.workflows.permission.WorkflowPermission;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
    private final WorkflowRepository repository;
    private final PolicyGenerator policyGenerator;
    private final ActionPermission actionPermission;
    private final DatasourcePermission datasourcePermission;
    private final WorkflowPermission workflowPermission;
    private final WorkspacePermission workspacePermission;

    public CrudWorkflowServiceImpl(
            DatasourceService datasourceService,
            NewActionService newActionService,
            WorkspaceService workspaceService,
            SessionUserService sessionUserService,
            WorkflowRepository repository,
            PolicyGenerator policyGenerator,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission,
            WorkflowPermission workflowPermission,
            WorkspacePermission workspacePermission) {
        super(repository);
        this.datasourceService = datasourceService;
        this.newActionService = newActionService;
        this.sessionUserService = sessionUserService;
        this.workspaceService = workspaceService;
        this.repository = repository;
        this.policyGenerator = policyGenerator;
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

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<Workflow> updateWorkflow(Workflow workflowUpdate, String workflowId) {
        Mono<User> userMono = sessionUserService.getCurrentUser().cache();

        return repository
                .findById(workflowId, workflowPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKFLOW_ID, workflowId)))
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

                    // Do any other clean up of supporting domain objects, etc as required

                    return archiveActionsByWorkflowIdMono.then(
                            repository.archive(workflowToDelete).thenReturn(workflowToDelete));
                });
    }

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
