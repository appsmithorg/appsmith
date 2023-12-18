package com.appsmith.server.newactions.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.modules.moduleentity.ModuleEntityService;
import com.appsmith.server.modules.permissions.ModulePermissionChecker;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NewActionModuleEntityServiceImpl extends NewActionModuleEntityServiceCECompatibleImpl
        implements ModuleEntityService<NewAction> {

    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final ModulePermissionChecker modulePermissionChecker;
    private final PolicyGenerator policyGenerator;
    private final RefactoringService refactoringService;

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<NewAction> createPrivateEntity(Reusable entity) {

        ActionDTO moduleActionDTO = (ActionDTO) entity;

        // branchName handling is left as a TODO for future git implementation for git connected modules.

        if (!StringUtils.hasLength(moduleActionDTO.getModuleId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.MODULE_ID));
        }
        Mono<Tuple2<Module, String>> modulePermissionCheckerMono = modulePermissionChecker
                .checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(
                        moduleActionDTO.getModuleId(), Optional.ofNullable(moduleActionDTO.getWorkspaceId()))
                .cache();

        return modulePermissionCheckerMono
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
                    // Check against widget names and action names
                    return refactoringService.isNameAllowed(
                            module.getId(), moduleActionDTO.getContextType(), layoutId, moduleActionDTO.getName());
                })
                .flatMap(nameAllowed -> {
                    // If the name is allowed, return pageMono for further processing
                    if (Boolean.FALSE.equals(nameAllowed)) {
                        String name = moduleActionDTO.getValidName();
                        // Throw an error since the new action's name matches an existing action or widget name.
                        return Mono.error(
                                new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR, name, FieldName.NAME));
                    }
                    return modulePermissionCheckerMono;
                })
                .flatMap(tuple2 -> {
                    // Name is allowed; Go ahead with creating the action
                    Module module = tuple2.getT1();
                    String workspaceId = tuple2.getT2();
                    NewAction moduleAction = ActionEntityHelper.generateActionDomain(
                            module.getId(), workspaceId, false, moduleActionDTO);
                    Set<Policy> childActionPolicies =
                            policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, Action.class);
                    moduleAction.setPolicies(childActionPolicies);

                    newActionService.setCommonFieldsFromActionDTOIntoNewAction(moduleActionDTO, moduleAction);

                    return Mono.just(moduleAction);
                });
    }

    @Override
    public Mono<List<Reusable>> getAllEntitiesForPackageEditor(String contextId, CreatorContextType contextType) {
        Flux<NewAction> actionFlux = newActionService.findAllActionsByContextIdAndContextTypeAndViewMode(
                contextId, contextType, actionPermission.getEditPermission(), false, false);

        return actionFlux
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(actionDTO -> (Reusable) actionDTO)
                .collectList();
    }
}
