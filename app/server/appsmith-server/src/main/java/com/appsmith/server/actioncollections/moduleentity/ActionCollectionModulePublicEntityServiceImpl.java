package com.appsmith.server.actioncollections.moduleentity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.modules.moduleentity.ModulePublicEntityService;
import com.appsmith.server.modules.permissions.ModulePermissionChecker;
import com.appsmith.server.services.LayoutCollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ActionCollectionModulePublicEntityServiceImpl extends ActionCollectionModulePublicEntityServiceCECompatible
        implements ModulePublicEntityService<ActionCollection> {
    private final ModulePermissionChecker modulePermissionChecker;
    private final PolicyGenerator policyGenerator;
    private final LayoutCollectionService layoutCollectionService;
    private final ActionCollectionService actionCollectionService;

    @Override
    public Mono<Reusable> createPublicEntity(String workspaceId, Module module, Reusable moduleConsumable) {
        return this.createModuleActionCollection(
                Optional.of(workspaceId), module.getId(), (ActionCollectionDTO) moduleConsumable, true);
    }

    private Mono<Reusable> createModuleActionCollection(
            Optional<String> workspaceIdOptional,
            String moduleId,
            ActionCollectionDTO actionCollectionDTO,
            boolean isPublic) {
        return modulePermissionChecker
                .checkIfCreateExecutableAllowedAndReturnModuleAndWorkspaceId(moduleId, workspaceIdOptional)
                .flatMap(tuple -> {
                    Module module = tuple.getT1();
                    String workspaceId = tuple.getT2();
                    ActionCollection moduleActionCollection = JSModuleEntityHelper.generateActionCollectionDomain(
                            moduleId, workspaceId, isPublic, actionCollectionDTO);
                    Set<Policy> childActionCollectionPolicies =
                            policyGenerator.getAllChildPolicies(module.getPolicies(), Module.class, Action.class);
                    moduleActionCollection.setPolicies(childActionCollectionPolicies);

                    return layoutCollectionService.createCollection(moduleActionCollection);
                });
    }

    @Override
    public Mono<Object> getPublicEntitySettingsForm(String moduleId) {
        return Mono.just(List.of());
    }

    @Override
    public Mono<Reusable> getPublicEntity(String moduleId) {
        return actionCollectionService
                .getPublicActionCollection(moduleId, ResourceModes.EDIT)
                .map(actionCollectionDTO -> actionCollectionDTO);
    }
}
