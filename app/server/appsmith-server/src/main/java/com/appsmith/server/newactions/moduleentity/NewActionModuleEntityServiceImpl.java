package com.appsmith.server.newactions.moduleentity;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.modules.moduleentity.ModuleEntityService;
import com.appsmith.server.modules.permissions.ModulePermissionChecker;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.plugins.base.PluginService;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NewActionModuleEntityServiceImpl extends NewActionModuleEntityServiceCECompatibleImpl
        implements ModuleEntityService<NewAction> {

    private final NewActionService newActionService;
    private final PolicyGenerator policyGenerator;
    private final ModulePermissionChecker modulePermissionChecker;
    private final PluginService pluginService;

    @Override
    public Mono<ModuleConsumable> createPublicEntity(
            String workspaceId, Module module, ModuleConsumable moduleConsumable) {

        return createModuleAction(Optional.of(workspaceId), module.getId(), (ModuleActionDTO) moduleConsumable, true);
    }

    @NotNull private Mono<ModuleConsumable> createModuleAction(
            Optional<String> workspaceIdOptional, String moduleId, ModuleActionDTO moduleActionDTO, boolean isPublic) {
        return modulePermissionChecker
                .checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(moduleId, workspaceIdOptional)
                .flatMap(tuple -> {
                    Module module = tuple.getT1();
                    String workspaceId = tuple.getT2();
                    NewAction moduleAction =
                            generateActionDomain(module.getId(), workspaceId, isPublic, moduleActionDTO);
                    Set<Policy> childActionPolicies =
                            policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, Action.class);
                    moduleAction.setPolicies(childActionPolicies);

                    return newActionService
                            .validateAndSaveActionToRepository(moduleAction)
                            .map(actionDTO -> (ModuleConsumable) actionDTO);
                });
    }

    private NewAction generateActionDomain(
            String moduleId, String workspaceId, boolean isPublic, ModuleActionDTO moduleActionDTO) {
        NewAction moduleAction = new NewAction();
        moduleAction.setWorkspaceId(workspaceId);

        moduleAction.setIsPublic(isPublic);
        moduleActionDTO.setModuleId(moduleId);
        moduleActionDTO.setDefaultResources(new DefaultResources());
        moduleActionDTO.setContextType(CreatorContextType.MODULE);

        moduleAction.setUnpublishedAction(moduleActionDTO);
        moduleAction.setPublishedAction(new ActionDTO());
        moduleAction.setDefaultResources(new DefaultResources());

        return moduleAction;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleConsumable> createPrivateEntity(ModuleConsumable entity, String branchName) {

        ModuleActionDTO action = (ModuleActionDTO) entity;

        // branchName handling is left as a TODO for future git implementation for git connected modules.

        if (!StringUtils.hasLength(action.getModuleId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.MODULE_ID));
        }

        return createModuleAction(Optional.empty(), action.getModuleId(), (ModuleActionDTO) entity, false);
    }

    @Override
    public Mono<Object> getPublicEntitySettingsForm(String moduleId) {
        Mono<NewAction> publicActionMono = newActionService.findPublicActionByModuleId(moduleId, ResourceModes.EDIT);

        return publicActionMono
                .flatMap(publicAction -> pluginService.getFormConfig(publicAction.getPluginId()))
                .map(pluginConfigMap -> {
                    return pluginConfigMap.getOrDefault("setting", List.of());
                });
    }
}
