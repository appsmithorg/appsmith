package com.appsmith.server.modules.services.crud.entity;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.solutions.ModulePermission;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;

@Service
public class CrudModuleEntityServiceImpl implements CrudModuleEntityService {
    private final ModuleRepository moduleRepository;
    private final NewActionService newActionService;
    private final ModulePermission modulePermission;

    public CrudModuleEntityServiceImpl(
            ModuleRepository moduleRepository, NewActionService newActionService, ModulePermission modulePermission) {
        this.moduleRepository = moduleRepository;
        this.newActionService = newActionService;
        this.modulePermission = modulePermission;
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

        moduleActionDTO.setContext(ActionDTO.ActionContext.MODULE);

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

            return newActionService.validateAndSaveActionToRepository(dbAction).map(actionDTO ->
                    ((ModuleActionDTO) actionDTO));
        });
    }
}
