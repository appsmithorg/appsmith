package com.appsmith.server.newactions.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.modules.moduleentity.ModulePublicEntityService;
import com.appsmith.server.modules.permissions.ModulePermissionChecker;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.plugins.base.PluginService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NewActionModulePublicEntityServiceImpl extends NewActionModulePublicEntityServiceCECompatible
        implements ModulePublicEntityService<NewAction> {
    private final NewActionService newActionService;
    private final PolicyGenerator policyGenerator;
    private final ModulePermissionChecker modulePermissionChecker;
    private final PluginService pluginService;

    @Override
    public Mono<Reusable> createPublicEntity(String workspaceId, Module module, Reusable moduleConsumable) {

        return createModuleAction(Optional.of(workspaceId), module.getId(), (ActionDTO) moduleConsumable, true);
    }

    private Mono<Reusable> createModuleAction(
            Optional<String> workspaceIdOptional, String moduleId, ActionDTO moduleActionDTO, boolean isPublic) {
        return modulePermissionChecker
                .checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(moduleId, workspaceIdOptional)
                .flatMap(tuple -> {
                    Module module = tuple.getT1();
                    String workspaceId = tuple.getT2();
                    NewAction moduleAction = ActionEntityHelper.generateActionDomain(
                            module.getId(), workspaceId, isPublic, moduleActionDTO);
                    Set<Policy> childActionPolicies =
                            policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, Action.class);
                    moduleAction.setPolicies(childActionPolicies);

                    return newActionService.validateAndSaveActionToRepository(moduleAction);
                });
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

    @Override
    public Mono<Reusable> getPublicEntity(String moduleId) {
        return newActionService
                .findPublicActionByModuleId(moduleId, ResourceModes.EDIT)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false));
    }
}
