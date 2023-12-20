package com.appsmith.server.services;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.helpers.ContextTypeUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.modules.moduleentity.ModuleEntityService;
import com.appsmith.server.modules.permissions.ModulePermissionChecker;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.ce.LayoutCollectionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.workflows.crud.CrudWorkflowEntityService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Optional;

import static com.appsmith.server.helpers.ContextTypeUtils.isModuleContext;
import static com.appsmith.server.helpers.ContextTypeUtils.isPageContext;
import static com.appsmith.server.helpers.ContextTypeUtils.isWorkflowContext;

@Service
@Slf4j
public class LayoutCollectionServiceImpl extends LayoutCollectionServiceCEImpl implements LayoutCollectionService {
    private final ModulePermissionChecker modulePermissionChecker;

    private final CrudWorkflowEntityService crudWorkflowEntityService;
    private final ModuleEntityService<ActionCollection> actionCollectionModuleEntityService;

    public LayoutCollectionServiceImpl(
            NewPageService newPageService,
            LayoutActionService layoutActionService,
            UpdateLayoutService updateLayoutService,
            RefactoringService refactoringService,
            ActionCollectionService actionCollectionService,
            NewActionService newActionService,
            AnalyticsService analyticsService,
            ResponseUtils responseUtils,
            ActionCollectionRepository actionCollectionRepository,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            CrudWorkflowEntityService crudWorkflowEntityService,
            ModuleEntityService<ActionCollection> actionCollectionModuleEntityService,
            ModulePermissionChecker modulePermissionChecker) {
        super(
                newPageService,
                layoutActionService,
                updateLayoutService,
                refactoringService,
                actionCollectionService,
                newActionService,
                analyticsService,
                responseUtils,
                actionCollectionRepository,
                pagePermission,
                actionPermission);
        this.crudWorkflowEntityService = crudWorkflowEntityService;
        this.actionCollectionModuleEntityService = actionCollectionModuleEntityService;
        this.modulePermissionChecker = modulePermissionChecker;
    }

    @Override
    protected Mono<ActionCollection> validateAndCreateActionCollectionDomain(
            ActionCollectionDTO collectionDTO, String branchName) {
        CreatorContextType contextType = ContextTypeUtils.getDefaultContextIfNull(collectionDTO.getContextType());
        switch (contextType) {
            case MODULE:
                return actionCollectionModuleEntityService.createPrivateEntity(collectionDTO);
            case WORKFLOW:
                return crudWorkflowEntityService.createWorkflowActionCollection(collectionDTO, branchName);
            default:
                return super.validateAndCreateActionCollectionDomain(collectionDTO, branchName);
        }
    }

    @Override
    public Flux<ActionCollection> findAllActionCollectionsByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean viewMode) {

        return actionCollectionService.findAllActionCollectionsByContextIdAndContextTypeAndViewMode(
                contextId, contextType, permission, viewMode);
    }

    @Override
    public Mono<ActionCollectionDTO> generateActionCollectionByViewMode(
            ActionCollection actionCollection, Boolean viewMode) {
        return actionCollectionService.generateActionCollectionByViewMode(actionCollection, viewMode);
    }

    protected void resetContextId(ActionCollectionDTO actionCollectionDTO) {
        if (isWorkflowContext(actionCollectionDTO.getContextType())) {
            actionCollectionDTO.setWorkflowId(null);
        } else if (isModuleContext(actionCollectionDTO.getContextType())) {
            actionCollectionDTO.setModuleId(null);
        } else {
            super.resetContextId(actionCollectionDTO);
        }
    }

    protected void setContextId(ActionCollection branchedActionCollection, ActionDTO actionDTO) {
        if (isWorkflowContext(
                branchedActionCollection.getUnpublishedCollection().getContextType())) {
            actionDTO.setWorkflowId(
                    branchedActionCollection.getUnpublishedCollection().getWorkflowId());
        } else if (isModuleContext(
                branchedActionCollection.getUnpublishedCollection().getContextType())) {
            actionDTO.setModuleId(
                    branchedActionCollection.getUnpublishedCollection().getModuleId());
        } else {
            super.setContextId(branchedActionCollection, actionDTO);
        }
    }

    @Override
    protected Mono<Boolean> checkIfNameAllowedBasedOnContext(ActionCollectionDTO collectionDTO) {
        if (isModuleContext(collectionDTO.getContextType())) {
            final String moduleId = collectionDTO.getModuleId();

            return modulePermissionChecker
                    .checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(
                            moduleId, Optional.of(collectionDTO.getWorkspaceId()))
                    .flatMap(tuple2 -> {
                        String layoutId = null;
                        Module module = tuple2.getT1();
                        if ((module.getUnpublishedModule().getLayouts() != null
                                && !module.getUnpublishedModule().getLayouts().isEmpty())) {
                            layoutId = module.getUnpublishedModule()
                                    .getLayouts()
                                    .get(0)
                                    .getId();
                        }
                        CreatorContextType contextType =
                                ContextTypeUtils.getDefaultContextIfNull(collectionDTO.getContextType());
                        // Check against widget names and action names
                        return refactoringService.isNameAllowed(
                                module.getId(), contextType, layoutId, collectionDTO.getName());
                    });
        } else if (isPageContext(collectionDTO.getContextType())) {
            return super.checkIfNameAllowedBasedOnContext(collectionDTO);
        } else {
            return Mono.just(Boolean.TRUE);
        }
    }
}
