package com.appsmith.server.moduleinstances.imports;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.ImportModuleInstanceResultDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserPermissionUtils;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.solutions.PagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleInstanceImportableServiceImpl implements ImportableService<ModuleInstance> {

    private final CrudModuleInstanceService crudModuleInstanceService;
    private final ModuleInstanceRepository repository;
    private final PagePermission pagePermission;
    private final ModuleInstancePermission moduleInstancePermission;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final DefaultResourcesService<ModuleInstance> defaultResourcesService;
    private final DefaultResourcesService<ModuleInstanceDTO> dtoDefaultResourcesService;
    private final DefaultResourcesService<NewAction> newActionDefaultResourcesService;
    private final DefaultResourcesService<ActionDTO> actionDTODefaultResourcesService;
    private final DefaultResourcesService<ActionCollection> actionCollectionDefaultResourcesService;
    private final DefaultResourcesService<ActionCollectionDTO> collectionDTODefaultResourcesService;

    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson,
            boolean isPartialImport) {

        List<ModuleInstance> moduleInstanceList = applicationJson.getModuleInstanceList();

        if (TRUE.equals(importingMetaDTO.getAppendToApp()) || moduleInstanceList == null) {
            // We do not support templates or partial import with module instances
            // Ignore these entities and proceed assuming we never actually get here
            // TODO: Determine if we need to error out here instead.
            return Mono.empty().then();
        }

        // At this point, we are either importing into a fresh app or a git synced app
        return applicationMono
                .flatMap(importedApplication -> importModuleInstances(
                        moduleInstanceList, importedApplication, importingMetaDTO, mappedImportableResourcesDTO))
                .flatMap(importModuleInstanceResultDTO -> {
                    log.info("Module instances imported. result: {}", importModuleInstanceResultDTO.getGist());
                    // Updating the existing application for git-sync
                    // During partial import/appending to the existing application keep the resources
                    // attached to the application:
                    // Delete the invalid resources (which are not the part of applicationJsonDTO) in
                    // the git flow only
                    if (StringUtils.hasText(importingMetaDTO.getApplicationId())
                            && !TRUE.equals(importingMetaDTO.getAppendToApp())
                            && CollectionUtils.isNotEmpty(importModuleInstanceResultDTO.getExistingModuleInstances())) {
                        // Remove unwanted module instances
                        Set<String> invalidModuleInstanceIds = new HashSet<>();
                        if (Boolean.FALSE.equals(isPartialImport)) {
                            for (ModuleInstance moduleInstance :
                                    importModuleInstanceResultDTO.getExistingModuleInstances()) {
                                if (!importModuleInstanceResultDTO
                                        .getImportedModuleInstanceIds()
                                        .contains(moduleInstance.getId())) {
                                    invalidModuleInstanceIds.add(moduleInstance.getId());
                                }
                            }
                        }
                        log.info(
                                "Deleting {} module instances which are no more used", invalidModuleInstanceIds.size());
                        return Flux.fromIterable(invalidModuleInstanceIds)
                                .flatMap(moduleInstanceId -> crudModuleInstanceService
                                        .deleteUnpublishedModuleInstance(moduleInstanceId)
                                        // return an empty action so that the filter can remove it from the list
                                        .onErrorResume(throwable -> {
                                            log.debug(
                                                    "Failed to delete action with id {} during import",
                                                    moduleInstanceId);
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        }))
                                .then()
                                .thenReturn(importModuleInstanceResultDTO);
                    }
                    return Mono.just(importModuleInstanceResultDTO);
                })
                .onErrorResume(throwable -> {
                    log.error("Error while importing actions and deleting unused ones", throwable);
                    return Mono.error(throwable);
                })
                .then();
    }

    @NotNull private Mono<ImportModuleInstanceResultDTO> importModuleInstances(
            List<ModuleInstance> moduleInstanceList,
            Application importedApplication,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        Mono<Map<String, ModuleInstance>> moduleInstancesInCurrentAppMono =
                getModuleInstancesInCurrentAppMono(importedApplication).collectMap(ModuleInstance::getGitSyncId);

        Mono<Map<String, ModuleInstance>> moduleInstancesInBranchesMono;
        if (importedApplication.getGitApplicationMetadata() != null) {
            final String defaultApplicationId =
                    importedApplication.getGitApplicationMetadata().getDefaultApplicationId();
            moduleInstancesInBranchesMono = repository
                    .findByDefaultApplicationId(defaultApplicationId, Optional.empty())
                    .filter(moduleInstance -> moduleInstance.getGitSyncId() != null)
                    .collectMap(ModuleInstance::getGitSyncId);
        } else {
            moduleInstancesInBranchesMono = Mono.just(Collections.emptyMap());
        }

        return Mono.zip(moduleInstancesInCurrentAppMono, moduleInstancesInBranchesMono)
                .flatMap(tuple2 -> {
                    Map<String, ModuleInstance> moduleInstancesInCurrentApp = tuple2.getT1();
                    Map<String, ModuleInstance> moduleInstancesInBranches = tuple2.getT2();

                    List<ModuleInstance> existingModuleInstanceList = new ArrayList<>();
                    ImportModuleInstanceResultDTO importModuleInstanceResultDTO = new ImportModuleInstanceResultDTO();
                    importModuleInstanceResultDTO.setExistingModuleInstances(existingModuleInstanceList);

                    List<Mono<CreateModuleInstanceResponseDTO>> newModuleInstanceMonoList = new ArrayList<>();
                    for (ModuleInstance moduleInstance : moduleInstanceList) {
                        // If this module instance does not have edit mode configs or a page attached, skip it
                        if (moduleInstance.getUnpublishedModuleInstance() == null
                                || !StringUtils.hasLength(moduleInstance
                                        .getUnpublishedModuleInstance()
                                        .getPageId())) {
                            continue;
                        }

                        NewPage parentPage = new NewPage();
                        ModuleInstanceDTO unpublishedModuleInstance = moduleInstance.getUnpublishedModuleInstance();
                        ModuleInstanceDTO publishedModuleInstance = moduleInstance.getPublishedModuleInstance();

                        // If pageId is missing in the moduleInstanceDTO create a fallback pageId
                        final String fallbackParentPageId = unpublishedModuleInstance.getPageId();

                        if (importedApplication.getGitApplicationMetadata() != null) {
                            final String defaultApplicationId = importedApplication
                                    .getGitApplicationMetadata()
                                    .getDefaultApplicationId();
                            if (moduleInstancesInBranches.containsKey(moduleInstance.getGitSyncId())) {
                                ModuleInstance branchedModuleInstance =
                                        moduleInstancesInBranches.get(moduleInstance.getGitSyncId());
                                defaultResourcesService.setFromOtherBranch(
                                        moduleInstance, branchedModuleInstance, importingMetaDTO.getBranchName());
                                dtoDefaultResourcesService.setFromOtherBranch(
                                        moduleInstance.getUnpublishedModuleInstance(),
                                        branchedModuleInstance.getUnpublishedModuleInstance(),
                                        importingMetaDTO.getBranchName());
                            } else {
                                defaultResourcesService.initialize(
                                        moduleInstance, importingMetaDTO.getBranchName(), false);
                                moduleInstance.getDefaultResources().setApplicationId(defaultApplicationId);
                                dtoDefaultResourcesService.initialize(
                                        moduleInstance.getUnpublishedModuleInstance(),
                                        importingMetaDTO.getBranchName(),
                                        false);
                            }
                        }

                        if (unpublishedModuleInstance.getName() != null) {
                            validateModuleReference(mappedImportableResourcesDTO, moduleInstance);
                            unpublishedModuleInstance.setId(moduleInstance.getId());
                            unpublishedModuleInstance.setSourceModuleId(moduleInstance.getSourceModuleId());
                            unpublishedModuleInstance.setModuleUUID(moduleInstance.getModuleUUID());
                            parentPage = updatePageInModuleInstance(
                                    unpublishedModuleInstance, mappedImportableResourcesDTO.getPageNameMap());
                            unpublishedModuleInstance.setContextId(unpublishedModuleInstance.getPageId());
                        }

                        if (publishedModuleInstance != null && publishedModuleInstance.getName() != null) {
                            publishedModuleInstance.setId(moduleInstance.getId());
                            if (!StringUtils.hasLength(publishedModuleInstance.getPageId())) {
                                publishedModuleInstance.setPageId(fallbackParentPageId);
                            }
                            NewPage publishedModuleInstancePage = updatePageInModuleInstance(
                                    publishedModuleInstance, mappedImportableResourcesDTO.getPageNameMap());
                            parentPage = parentPage == null ? publishedModuleInstancePage : parentPage;
                        }

                        NewPage finalParentPage = parentPage;

                        // Check if the module instance has gitSyncId and if it's already in DB
                        if (existingAppContainsModuleInstance(moduleInstancesInCurrentApp, moduleInstance)) {

                            // Since the resource is already present in DB, just update resource
                            ModuleInstance existingInstance =
                                    moduleInstancesInCurrentApp.get(moduleInstance.getGitSyncId());
                            updateExistingInstance(existingInstance, moduleInstance, importingMetaDTO);

                            // Add it to modules instance list that'll be updated in bulk
                            existingModuleInstanceList.add(existingInstance);

                            updateMappedModuleInstanceRef(
                                    mappedImportableResourcesDTO,
                                    finalParentPage,
                                    existingInstance.getUnpublishedModuleInstance());

                            importModuleInstanceResultDTO
                                    .getImportedModuleInstanceIds()
                                    .add(existingInstance.getId());

                        } else {

                            // check whether user has permission to add new module instance
                            if (!UserPermissionUtils.validateDomainObjectPermissionExists(
                                    parentPage,
                                    pagePermission.getModuleInstanceCreatePermission(),
                                    importingMetaDTO.getCurrentUserPermissionGroups())) {
                                log.error(
                                        "User does not have permission to create module instance in page with id: {}",
                                        parentPage.getId());
                                return Mono.error(new AppsmithException(
                                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, parentPage.getId()));
                            }

                            Mono<CreateModuleInstanceResponseDTO> createModuleInstanceMono =
                                    createImportedModuleInstance(moduleInstance, importingMetaDTO)
                                            .doOnNext(responseDTO -> updateMappedModuleInstanceRef(
                                                    mappedImportableResourcesDTO,
                                                    finalParentPage,
                                                    responseDTO.getModuleInstance()));

                            newModuleInstanceMonoList.add(createModuleInstanceMono);
                        }
                    }

                    Mono<List<ModuleInstance>> bulkInsertMono = Flux.merge(newModuleInstanceMonoList)
                            .map(responseDTO -> responseDTO.getModuleInstance().getId())
                            .collectList()
                            .flatMapMany(repository::findAllById)
                            .collectList()
                            .flatMap(newModuleInstanceList -> {
                                if (importingMetaDTO.getBranchName() != null) {
                                    return updateDefaultResourcesForPrivateCompositeEntities(
                                                    newModuleInstanceList, importingMetaDTO)
                                            .thenReturn(newModuleInstanceList);
                                } else return Mono.just(newModuleInstanceList);
                            });

                    Mono<List<ModuleInstance>> bulkUpdateMono = repository
                            .bulkUpdate(existingModuleInstanceList)
                            .then(Mono.defer(() -> {
                                if (importingMetaDTO.getBranchName() != null) {
                                    return updateDefaultResourcesForPrivateCompositeEntities(
                                                    existingModuleInstanceList, importingMetaDTO)
                                            .thenReturn(existingModuleInstanceList);
                                } else {
                                    return Mono.just(existingModuleInstanceList);
                                }
                            }));

                    // Save all the new module instances in bulk
                    return bulkInsertMono.zipWith(bulkUpdateMono).thenReturn(importModuleInstanceResultDTO);
                });
    }

    private Mono<Tuple2<List<List<NewAction>>, List<List<ActionCollection>>>>
            updateDefaultResourcesForPrivateCompositeEntities(
                    List<ModuleInstance> moduleInstanceList, ImportingMetaDTO importingMetaDTO) {
        Flux<Tuple2<String, String>> moduleInstanceIdsCache = Flux.fromIterable(moduleInstanceList)
                .mapNotNull(moduleInstance -> Tuples.of(
                        moduleInstance.getId(),
                        moduleInstance.getDefaultResources().getModuleInstanceId()))
                .cache();

        Mono<List<List<NewAction>>> updatedActionsMono = moduleInstanceIdsCache
                .flatMap(tuple2 -> {
                    String existingModuleInstanceId = tuple2.getT1();
                    String defaultModuleInstanceId = tuple2.getT2();
                    Mono<Map<String, NewAction>> defaultActionsMapMono = newActionService
                            .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                                    defaultModuleInstanceId, null, true)
                            .filter(newAction -> FALSE.equals(newAction.getIsPublic()))
                            .collectMap(
                                    newAction -> newAction.getRootModuleInstanceId() + "_"
                                            + newAction.getUnpublishedAction().getValidName(),
                                    newAction -> newAction);
                    return defaultActionsMapMono.flatMap(defaultActionsMap -> {
                        return newActionService
                                .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                                        existingModuleInstanceId, null, true)
                                .filter(newAction -> FALSE.equals(newAction.getIsPublic()))
                                .doOnNext(newAction -> {
                                    String defaultActionsKey = defaultModuleInstanceId + "_"
                                            + newAction.getUnpublishedAction().getValidName();
                                    if (defaultActionsMap.containsKey(defaultActionsKey)) {
                                        NewAction defaultNewAction = defaultActionsMap.get(defaultActionsKey);
                                        newActionDefaultResourcesService.setFromOtherBranch(
                                                newAction, defaultNewAction, importingMetaDTO.getBranchName());
                                        actionDTODefaultResourcesService.setFromOtherBranch(
                                                newAction.getUnpublishedAction(),
                                                defaultNewAction.getUnpublishedAction(),
                                                importingMetaDTO.getBranchName());
                                    }
                                })
                                .collectList()
                                .flatMapMany(newActionService::saveAll)
                                .collectList();
                    });
                })
                .collectList();

        Mono<List<List<ActionCollection>>> updatedCollectionsMono = moduleInstanceIdsCache
                .flatMap(tuple2 -> {
                    String existingModuleInstanceId = tuple2.getT1();
                    String defaultModuleInstanceId = tuple2.getT2();

                    Mono<Map<String, ActionCollection>> defaultCollectionsMapMono = actionCollectionService
                            .findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(
                                    defaultModuleInstanceId, null)
                            .filter(newAction -> FALSE.equals(newAction.getIsPublic()))
                            .collectMap(
                                    actionCollection -> actionCollection.getRootModuleInstanceId() + "_"
                                            + actionCollection
                                                    .getUnpublishedCollection()
                                                    .getName(),
                                    actionCollection -> actionCollection);
                    return defaultCollectionsMapMono.flatMap(defaultCollectionsMap -> {
                        return actionCollectionService
                                .findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(
                                        existingModuleInstanceId, null)
                                .filter(actionCollection -> FALSE.equals(actionCollection.getIsPublic()))
                                .doOnNext(actionCollection -> {
                                    String defaultCollectionsKey = defaultModuleInstanceId + "_"
                                            + actionCollection
                                                    .getUnpublishedCollection()
                                                    .getName();
                                    if (defaultCollectionsMap.containsKey(defaultCollectionsKey)) {
                                        ActionCollection defaultActionCollection =
                                                defaultCollectionsMap.get(defaultCollectionsKey);
                                        actionCollectionDefaultResourcesService.setFromOtherBranch(
                                                actionCollection,
                                                defaultActionCollection,
                                                importingMetaDTO.getBranchName());
                                        collectionDTODefaultResourcesService.setFromOtherBranch(
                                                actionCollection.getUnpublishedCollection(),
                                                defaultActionCollection.getUnpublishedCollection(),
                                                importingMetaDTO.getBranchName());
                                    }
                                })
                                .collectList()
                                .flatMapMany(actionCollectionService::saveAll)
                                .collectList();
                    });
                })
                .collectList();

        return updatedActionsMono.zipWith(updatedCollectionsMono);
    }

    private void updateExistingInstance(
            ModuleInstance existingInstance, ModuleInstance moduleInstanceToImport, ImportingMetaDTO importingMetaDTO) {
        if (!UserPermissionUtils.validateDomainObjectPermissionExists(
                existingInstance,
                moduleInstancePermission.getEditPermission(),
                importingMetaDTO.getCurrentUserPermissionGroups())) {
            log.error("User does not have permission to edit module instance with id: {}", existingInstance.getId());
            throw new AppsmithException(
                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_INSTANCE, existingInstance.getId());
        }

        // Since the resource is already present in DB, just update resource
        Set<Policy> existingPolicy = existingInstance.getPolicies();
        moduleInstanceToImport.setId(existingInstance.getId());

        copyNestedNonNullProperties(moduleInstanceToImport, existingInstance);
        // Update branchName
        existingInstance.getDefaultResources().setBranchName(importingMetaDTO.getBranchName());
        // Recover the deleted state present in DB from imported module instance
        existingInstance
                .getUnpublishedModuleInstance()
                .setDeletedAt(
                        moduleInstanceToImport.getUnpublishedModuleInstance().getDeletedAt());
        existingInstance.setDeletedAt(moduleInstanceToImport.getDeletedAt());
        existingInstance.setPolicies(existingPolicy);
    }

    private boolean existingAppContainsModuleInstance(
            Map<String, ModuleInstance> moduleInstancesInCurrentApp, ModuleInstance moduleInstance) {
        return moduleInstance.getGitSyncId() != null
                && moduleInstancesInCurrentApp.containsKey(moduleInstance.getGitSyncId());
    }

    private void updateMappedModuleInstanceRef(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            NewPage finalParentPage,
            ModuleInstanceDTO savedModuleInstance) {
        // Update moduleInstanceRef to Id map for composed entities to use
        Map<String, String> instanceRefToIdMap = mappedImportableResourcesDTO.getModuleInstanceRefToIdMap();
        instanceRefToIdMap.put(
                finalParentPage.getUnpublishedPage().getName() + "_" + savedModuleInstance.getName(),
                savedModuleInstance.getId());
    }

    private Flux<ModuleInstance> getModuleInstancesInCurrentAppMono(Application importedApplication) {
        return repository.findByApplicationId(importedApplication.getId());
    }

    /**
     * This method will always generate a new module instance object based on the unpublished object.
     * Make sure to populate the DTO with anything that needs to be part of the domain object as well.
     *
     * @param moduleInstance
     * @param importingMetaDTO
     * @return
     */
    private Mono<CreateModuleInstanceResponseDTO> createImportedModuleInstance(
            ModuleInstance moduleInstance, ImportingMetaDTO importingMetaDTO) {

        ModuleInstanceDTO moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        if (moduleInstanceDTO.getDefaultResources() != null) {
            String defaultPageId = moduleInstanceDTO.getDefaultResources().getPageId();
            DefaultResources defaultResources = moduleInstance.getDefaultResources();
            defaultResources.setPageId(defaultPageId);
            moduleInstanceDTO.setDefaultResources(defaultResources);
        }

        // set gitSyncId, if it doesn't exist
        if (moduleInstance.getGitSyncId() == null) {
            moduleInstanceDTO.setGitSyncId(
                    moduleInstance.getApplicationId() + "_" + Instant.now().toString());
        } else {
            moduleInstanceDTO.setGitSyncId(moduleInstance.getGitSyncId());
        }

        moduleInstanceDTO.setType(moduleInstance.getType());

        if (TRUE.equals(moduleInstanceDTO.getIsValid())) {
            return crudModuleInstanceService.createModuleInstance(moduleInstanceDTO, importingMetaDTO.getBranchName());
        } else {
            return crudModuleInstanceService.createOrphanModuleInstance(
                    moduleInstanceDTO, importingMetaDTO.getBranchName());
        }
    }

    private NewPage updatePageInModuleInstance(ModuleInstanceDTO moduleInstanceDTO, Map<String, NewPage> pageNameMap) {
        NewPage parentPage = pageNameMap.get(moduleInstanceDTO.getPageId());
        if (parentPage == null) {
            return null;
        }
        moduleInstanceDTO.setPageId(parentPage.getId());

        return parentPage;
    }

    private void validateModuleReference(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, ModuleInstance moduleInstance) {
        Map<String, Module> moduleUUIDToModuleMap = mappedImportableResourcesDTO.getModuleUUIDToModuleMap();
        ModuleInstanceDTO moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        if (moduleUUIDToModuleMap.containsKey(moduleInstance.getModuleUUID())) {
            moduleInstance.setSourceModuleId(
                    moduleUUIDToModuleMap.get(moduleInstance.getModuleUUID()).getId());
            moduleInstance.setOriginModuleId(
                    moduleUUIDToModuleMap.get(moduleInstance.getModuleUUID()).getOriginModuleId());

            moduleInstanceDTO.setIsValid(true);
        } else {
            ExportableModule exportableModule = mappedImportableResourcesDTO
                    .getModuleUUIDToExportableModuleMap()
                    .get(moduleInstance.getModuleUUID());
            String invalidMessage = String.format(
                    "Module instance does not have a valid module reference in the workspace. Please import module %s from package \"%s\" v%s to fix this issue.",
                    exportableModule.getModuleName(), exportableModule.getPackageName(), exportableModule.getVersion());
            // Make sure that the references to module are reset so that when the module is imported,
            // the next publish on it will update and instantiate this module instance correctly
            // We know this will happen because auto-upgrade checks for matching originModuleId or
            // missing originModuleId but matching moduleUUID
            moduleInstance.setSourceModuleId(null);
            moduleInstance.setOriginModuleId(null);

            Set<String> invalids = moduleInstanceDTO.getInvalids();
            if (invalids == null) {
                invalids = new HashSet<>();
            }
            invalids.add(invalidMessage);
            moduleInstanceDTO.setInvalids(invalids);

            moduleInstanceDTO.setIsValid(false);
        }
    }
}
