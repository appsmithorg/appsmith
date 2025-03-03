package com.appsmith.server.services;

import com.appsmith.external.annotations.FeatureFlagged;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.CreateActionMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstantiation.JSActionType;
import com.appsmith.server.modules.crud.entity.LayoutModuleEntityService;
import com.appsmith.server.modules.metadata.ModuleMetadataService;
import com.appsmith.server.modules.moduleentity.ModuleEntityService;
import com.appsmith.server.modules.moduleentity.ModulePublicEntityService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.ce.LayoutActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.workflows.crud.CrudWorkflowEntityService;
import com.appsmith.server.workflows.metadata.WorkflowMetadataService;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.server.helpers.ContextTypeUtils.getDefaultContextIfNull;
import static com.appsmith.server.helpers.ContextTypeUtils.isModuleContext;
import static com.appsmith.server.workflows.helpers.WorkflowUtils.isWorkflowContext;

@Service
@Slf4j
public class LayoutActionServiceImpl extends LayoutActionServiceCEImpl implements LayoutActionService {

    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;
    private final ModuleEntityService<NewAction> newActionModuleEntityService;
    private final ModulePublicEntityService<JSActionType, NewAction> jsActionTypeNewActionModulePublicEntityService;
    private final CrudWorkflowEntityService crudWorkflowEntityService;
    private final ModuleMetadataService moduleMetadataService;
    private final WorkflowMetadataService workflowMetadataService;
    private final LayoutModuleEntityService layoutModuleEntityService;

    public LayoutActionServiceImpl(
            AnalyticsService analyticsService,
            NewPageService newPageService,
            NewActionService newActionService,
            RefactoringService refactoringService,
            CollectionService collectionService,
            UpdateLayoutService updateLayoutService,
            DatasourceService datasourceService,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            ObservationRegistry observationRegistry,
            DatasourcePermission datasourcePermission,
            ModuleEntityService<NewAction> newActionModuleEntityService,
            ModulePublicEntityService<JSActionType, NewAction> jsActionTypeNewActionModulePublicEntityService,
            CrudWorkflowEntityService crudWorkflowEntityService,
            ModuleMetadataService moduleMetadataService,
            WorkflowMetadataService workflowMetadataService,
            LayoutModuleEntityService layoutModuleEntityService) {

        super(
                analyticsService,
                newPageService,
                newActionService,
                refactoringService,
                collectionService,
                updateLayoutService,
                datasourceService,
                pagePermission,
                actionPermission,
                observationRegistry);

        this.datasourceService = datasourceService;
        this.datasourcePermission = datasourcePermission;
        this.newActionModuleEntityService = newActionModuleEntityService;
        this.jsActionTypeNewActionModulePublicEntityService = jsActionTypeNewActionModulePublicEntityService;
        this.crudWorkflowEntityService = crudWorkflowEntityService;
        this.moduleMetadataService = moduleMetadataService;
        this.workflowMetadataService = workflowMetadataService;
        this.layoutModuleEntityService = layoutModuleEntityService;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<ActionDTO> createAction(ActionDTO actionDTO, CreateActionMetaDTO createActionMetaDTO) {
        Mono<ActionDTO> createActionMono = super.createAction(actionDTO, createActionMetaDTO);

        // If it is an embedded datasource, continue.
        if (actionDTO.getDatasource() == null
                || !StringUtils.hasLength(actionDTO.getDatasource().getId())) {
            return createActionMono;
        }

        // Check if the user is allowed to create actions on the said datasource and only then proceed.
        String datasourceId = actionDTO.getDatasource().getId();
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(user -> datasourceService.findById(
                        datasourceId, datasourcePermission.getActionCreatePermission(user.getOrganizationId())))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "datasource", datasourceId)))
                .then(createActionMono);
    }

    @Override
    public Mono<ActionDTO> createSingleAction(ActionDTO actionDTO, Boolean isJsAction) {
        CreatorContextType contextType = getDefaultContextIfNull(actionDTO.getContextType());
        AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.DEFAULT);
        CreateActionMetaDTO createActionMetaDTO = new CreateActionMetaDTO();
        createActionMetaDTO.setIsJsAction(isJsAction);
        createActionMetaDTO.setEventContext(eventContext);
        switch (contextType) {
            case WORKFLOW:
                return this.createAction(actionDTO, createActionMetaDTO)
                        .flatMap(createdActionDTO -> workflowMetadataService
                                .saveLastEditInformation(createdActionDTO.getWorkflowId())
                                .thenReturn(createdActionDTO));
            case MODULE:
                return this.createAction(actionDTO, createActionMetaDTO)
                        .flatMap(createdActionDTO -> moduleMetadataService
                                .saveLastEditInformation(createdActionDTO.getModuleId())
                                .thenReturn(createdActionDTO));
            default:
                return super.createSingleAction(actionDTO, isJsAction);
        }
    }

    @Override
    protected Mono<ActionDTO> updateActionBasedOnContextType(NewAction newAction, ActionDTO action) {
        if (isWorkflowContext(action)) {
            return crudWorkflowEntityService.updateWorkflowAction(newAction.getId(), action);
        }
        if (isModuleContext(action.getContextType())) {
            return layoutModuleEntityService.updateAction(newAction.getId(), action);
        }
        return super.updateActionBasedOnContextType(newAction, action);
    }

    @Override
    protected Mono<NewAction> validateAndGenerateActionDomainBasedOnContext(
            ActionDTO action, CreateActionMetaDTO createActionMetaDTO) {
        CreatorContextType contextType = getDefaultContextIfNull(action.getContextType());
        switch (contextType) {
            case WORKFLOW:
                return crudWorkflowEntityService.createWorkflowAction(action, null);
            case MODULE:
                if (Boolean.TRUE.equals(action.getIsPublic())) {
                    return jsActionTypeNewActionModulePublicEntityService.createPublicEntity(action);
                }
                return newActionModuleEntityService.createPrivateEntity(action);
            default:
                return super.validateAndGenerateActionDomainBasedOnContext(action, createActionMetaDTO);
        }
    }
}
