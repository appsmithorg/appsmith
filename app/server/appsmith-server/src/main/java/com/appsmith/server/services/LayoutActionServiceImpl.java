package com.appsmith.server.services;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.modules.moduleentity.ModuleEntityService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.ce.LayoutActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.workflows.crud.CrudWorkflowEntityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.server.modules.helpers.ModuleUtils.isModuleAction;
import static com.appsmith.server.workflows.helpers.WorkflowUtils.isWorkflowContext;

@Service
@Slf4j
public class LayoutActionServiceImpl extends LayoutActionServiceCEImpl implements LayoutActionService {

    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;
    private final ModuleEntityService<NewAction> newActionModuleEntityService;
    private final CrudWorkflowEntityService crudWorkflowEntityService;

    public LayoutActionServiceImpl(
            AnalyticsService analyticsService,
            NewPageService newPageService,
            NewActionService newActionService,
            RefactoringService refactoringService,
            CollectionService collectionService,
            UpdateLayoutService updateLayoutService,
            ResponseUtils responseUtils,
            DatasourceService datasourceService,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission,
            ModuleEntityService<NewAction> newActionModuleEntityService,
            CrudWorkflowEntityService crudWorkflowEntityService) {

        super(
                analyticsService,
                newPageService,
                newActionService,
                refactoringService,
                collectionService,
                updateLayoutService,
                responseUtils,
                datasourceService,
                pagePermission,
                actionPermission);

        this.datasourceService = datasourceService;
        this.datasourcePermission = datasourcePermission;
        this.newActionModuleEntityService = newActionModuleEntityService;
        this.crudWorkflowEntityService = crudWorkflowEntityService;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<ActionDTO> createAction(ActionDTO action, AppsmithEventContext eventContext, Boolean isJsAction) {
        Mono<ActionDTO> createActionMono = super.createAction(action, eventContext, isJsAction);

        // If it is an embedded datasource, continue.
        if (action.getDatasource() == null
                || !StringUtils.hasLength(action.getDatasource().getId())) {
            return createActionMono;
        }

        // Check if the user is allowed to create actions on the said datasource and only then proceed.
        String datasourceId = action.getDatasource().getId();
        return datasourceService
                .findById(datasourceId, datasourcePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "datasource", datasourceId)))
                .then(createActionMono);
    }

    @Override
    public Mono<ActionDTO> createSingleActionWithBranch(ActionDTO action, String branchName) {

        if (isModuleAction(action)) {
            return newActionModuleEntityService
                    .createPrivateEntity((ModuleConsumable) action, branchName)
                    .map(createdEntity -> (ActionDTO) createdEntity);
        }

        if (isWorkflowContext(action)) {
            return crudWorkflowEntityService.createWorkflowAction(action, branchName);
        }

        return super.createSingleActionWithBranch(action, branchName);
    }

    @Override
    protected Mono<ActionDTO> updateActionBasedOnContextType(NewAction newAction, ActionDTO action) {
        if (isWorkflowContext(action)) {
            return crudWorkflowEntityService.updateWorkflowAction(newAction.getId(), action);
        }
        return super.updateActionBasedOnContextType(newAction, action);
    }
}
