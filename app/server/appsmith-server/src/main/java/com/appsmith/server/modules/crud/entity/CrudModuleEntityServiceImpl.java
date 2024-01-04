package com.appsmith.server.modules.crud.entity;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleEntitiesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.modules.metadata.ModuleMetadataService;
import com.appsmith.server.modules.moduleentity.ModuleEntityService;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;

@Service
@RequiredArgsConstructor
public class CrudModuleEntityServiceImpl extends CrudModuleEntityServiceCECompatibleImpl
        implements CrudModuleEntityService {
    private final ModuleRepository moduleRepository;
    private final NewActionService newActionService;
    private final ModulePermission modulePermission;
    // TODO: Remove actionPermission once we remove the dependency on `getActions`
    private final ActionPermission actionPermission;
    private final ModuleEntityService<NewAction> newActionModuleEntityService;
    private final ModuleEntityService<ActionCollection> actionCollectionModuleEntityService;
    private final ModuleMetadataService moduleMetadataService;

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
    public Mono<ActionDTO> updateModuleAction(ModuleActionDTO moduleActionDTO, String moduleId, String actionId) {
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
                    .flatMap(moduleActionTuple -> moduleMetadataService
                            .saveLastEditInformation(moduleId)
                            .thenReturn(moduleActionTuple.getT1()));
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<List<ActionDTO>> getModuleActions(String moduleId) {
        Mono<Module> moduleMono = moduleRepository
                .findById(moduleId, modulePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_ID, moduleId)));

        return moduleMono.flatMap(module -> newActionService
                .findAllActionsByContextIdAndContextTypeAndViewMode(
                        module.getId(), CreatorContextType.MODULE, actionPermission.getEditPermission(), false, false)
                .flatMap(moduleAction -> newActionService.generateActionByViewMode(moduleAction, false))
                .collectList());
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleEntitiesDTO> getAllEntities(String contextId, CreatorContextType contextType, String branchName) {

        Mono<List<Reusable>> actionsMono =
                newActionModuleEntityService.getAllEntitiesForPackageEditor(contextId, contextType);
        Mono<List<Reusable>> actionCollectionsMono =
                actionCollectionModuleEntityService.getAllEntitiesForPackageEditor(contextId, contextType);

        return Mono.zip(actionsMono, actionCollectionsMono).flatMap(tuple2 -> {
            ModuleEntitiesDTO moduleEntitiesDTO = new ModuleEntitiesDTO();
            List<ActionDTO> actionDTOs = (List<ActionDTO>) (List<?>) tuple2.getT1();
            List<ActionCollectionDTO> actionCollectionDTOs = (List<ActionCollectionDTO>) (List<?>) tuple2.getT2();
            moduleEntitiesDTO.setActions(actionDTOs);
            moduleEntitiesDTO.setJsCollections(actionCollectionDTOs);
            return Mono.just(moduleEntitiesDTO);
        });
    }
}
