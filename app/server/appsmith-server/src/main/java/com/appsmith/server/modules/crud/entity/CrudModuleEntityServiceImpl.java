package com.appsmith.server.modules.crud.entity;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;

@Service
public class CrudModuleEntityServiceImpl extends CrudModuleEntityServiceCECompatibleImpl
        implements CrudModuleEntityService {
    private final ModuleRepository moduleRepository;
    private final NewActionService newActionService;
    private final ModulePermission modulePermission;
    private final ActionPermission actionPermission;

    public CrudModuleEntityServiceImpl(
            ModuleRepository moduleRepository,
            NewActionService newActionService,
            ModulePermission modulePermission,
            ActionPermission actionPermission) {
        this.moduleRepository = moduleRepository;
        this.newActionService = newActionService;
        this.modulePermission = modulePermission;
        this.actionPermission = actionPermission;
    }

    /**
     * Updates a module's action (API, Query), whether it is public or private. When dealing with Query modules, this method is used to update the public entity as there are no private entities in Query modules.
     *
     * @param moduleActionDTO The updated action data to be saved.
     * @param moduleId        The unique identifier of the module.
     * @param actionId        The unique identifier of the action to be updated.
     * @return A Mono emitting the updated ModuleActionDTO.
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleActionDTO> updateModuleAction(ModuleActionDTO moduleActionDTO, String moduleId, String actionId) {
        Mono<Module> moduleMono = moduleRepository
                .findById(moduleId, modulePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)));

        moduleActionDTO.setContextType(CreatorContextType.MODULE);

        Mono<NewAction> updatedActionMono = newActionService
                .findById(actionId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId)))
                .map(dbAction -> {
                    final ActionDTO unpublishedAction = dbAction.getUnpublishedAction();
                    copyNewFieldValuesIntoOldObject(moduleActionDTO, unpublishedAction);
                    return dbAction;
                });

        return moduleMono.zipWith(updatedActionMono).flatMap(tuple2 -> {
            Module module = tuple2.getT1();
            NewAction dbAction = tuple2.getT2();

            if (dbAction.getUnpublishedAction().getModuleId() == null
                    || !dbAction.getUnpublishedAction().getModuleId().equals(module.getId())) {
                return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId));
            }

            return newActionService
                    .updateUnpublishedActionWithoutAnalytics(dbAction.getId(), moduleActionDTO, Optional.empty())
                    .flatMap(moduleActionTuple -> Mono.just((ModuleActionDTO) moduleActionTuple.getT1()));
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<List<ModuleConsumable>> getModuleActions(String moduleId) {
        Mono<Module> moduleMono = moduleRepository
                .findById(moduleId, modulePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)));

        return moduleMono.flatMap(module -> newActionService
                .findAllActionsByContextIdAndContextTypeAndViewMode(
                        module.getId(), CreatorContextType.MODULE, actionPermission.getEditPermission(), false, false)
                .flatMap(moduleAction -> newActionService.generateActionByViewMode(moduleAction, false))
                .collectList()
                .map(actionList -> actionList.stream()
                        .map(actionDTO -> (ModuleConsumable) actionDTO)
                        .collect(Collectors.toList())));
    }
}
