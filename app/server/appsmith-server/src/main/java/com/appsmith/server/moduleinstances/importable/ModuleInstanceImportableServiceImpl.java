package com.appsmith.server.moduleinstances.importable;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ArtifactExchangeJson;
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
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.permissions.ModulePermission;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.solutions.PagePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleInstanceImportableServiceImpl implements ImportableService<ModuleInstance> {

    private final CrudModuleInstanceService crudModuleInstanceService;
    private final ModuleInstanceRepository repository;
    private final ModuleInstancePermission moduleInstancePermission;
    private final PagePermission pagePermission;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final CrudPackageService crudPackageService;
    private final CrudModuleService crudModuleService;
    private final ModulePermission modulePermission;
    private final DefaultResourcesService<ModuleInstance> defaultResourcesService;
    private final DefaultResourcesService<ModuleInstanceDTO> dtoDefaultResourcesService;
    private final DefaultResourcesService<NewAction> newActionDefaultResourcesService;
    private final DefaultResourcesService<ActionDTO> actionDTODefaultResourcesService;
    private final DefaultResourcesService<ActionCollection> actionCollectionDefaultResourcesService;
    private final DefaultResourcesService<ActionCollectionDTO> collectionDTODefaultResourcesService;

    @Override
    public ArtifactBasedImportableService<ModuleInstance, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        return null;
    }

    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        Mono<Void> createModuleReferencesMono =
                validateAndCreateModuleReferences(artifactExchangeJson, mappedImportableResourcesDTO, importingMetaDTO);

        List<ModuleInstance> moduleInstanceList = artifactExchangeJson.getModuleInstanceList();

        if (moduleInstanceList == null) {
            moduleInstanceList = new ArrayList<>();
        }

        Mono<List<ModuleInstance>> importedModuleInstancesMono =
                createModuleReferencesMono.then(Mono.justOrEmpty(moduleInstanceList));
        if (Boolean.TRUE.equals(importingMetaDTO.getAppendToArtifact())) {
            importedModuleInstancesMono = importedModuleInstancesMono.map(moduleInstanceList1 -> {
                List<NewPage> importedNewPages = mappedImportableResourcesDTO.getContextMap().values().stream()
                        .map(context -> (NewPage) context)
                        .distinct()
                        .toList();

                Map<String, String> newToOldNameMap = mappedImportableResourcesDTO.getContextNewNameToOldName();

                for (NewPage newPage : importedNewPages) {
                    String newPageName = newPage.getUnpublishedPage().getName();
                    String oldPageName = newToOldNameMap.get(newPageName);

                    if (!newPageName.equals(oldPageName)) {
                        renamePageInModuleInstances(moduleInstanceList1, oldPageName, newPageName);
                    }
                }
                return moduleInstanceList1;
            });
        }

        // At this point, we are either importing into a fresh app or a git synced app
        return Mono.zip(importedModuleInstancesMono, importableArtifactMono)
                .flatMap(tuple2 -> {
                    List<ModuleInstance> moduleInstances = tuple2.getT1();
                    ImportableArtifact importableArtifact = tuple2.getT2();
                    return importModuleInstances(
                            moduleInstances, importableArtifact, importingMetaDTO, mappedImportableResourcesDTO);
                })
                .flatMap(importModuleInstanceResultDTO -> {
                    log.info("Module instances imported. result: {}", importModuleInstanceResultDTO.getGist());
                    // Updating the existing application for git-sync
                    // During partial import/appending to the existing application keep the resources
                    // attached to the application:
                    // Delete the invalid resources (which are not the part of applicationJsonDTO) in
                    // the git flow only
                    if (StringUtils.hasText(importingMetaDTO.getArtifactId())
                            && !TRUE.equals(importingMetaDTO.getAppendToArtifact())
                            && CollectionUtils.isNotEmpty(importModuleInstanceResultDTO.getExistingModuleInstances())) {
                        // Remove unwanted module instances
                        Set<String> invalidModuleInstanceIds = new HashSet<>();
                        if (Boolean.FALSE.equals(importingMetaDTO.getIsPartialImport())) {
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

    private Mono<Void> validateAndCreateModuleReferences(
            ArtifactExchangeJson artifactExchangeJson,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO) {
        List<ExportableModule> sourceModuleList = CollectionUtils.isEmpty(artifactExchangeJson.getSourceModuleList())
                ? new ArrayList<>()
                : artifactExchangeJson.getSourceModuleList();

        Map<String, Module> moduleUUIDToModuleMap = mappedImportableResourcesDTO.getModuleUUIDToModuleMap();
        Map<String, ExportableModule> moduleUUIDToExportableModuleMap =
                mappedImportableResourcesDTO.getModuleUUIDToExportableModuleMap();

        sourceModuleList.stream().forEach(exportableModule -> {
            moduleUUIDToExportableModuleMap.put(exportableModule.getModuleUUID(), exportableModule);
        });

        // For each package in this list, check if the workspace already has such a definition
        // If it does, we can assume that module instance import will succeed validation (if ACL allows)
        //     For this, map the package UUID-version combo to the existing packageId in workspace
        // If it does not, we will need to mark the corresponding module instances as invalid
        //     Absence of UUID-version entry in the map will indicate such a state

        // No actual import is performed for packages here
        return crudPackageService
                .getAllPublishedPackagesByUniqueRef(importingMetaDTO.getWorkspaceId(), sourceModuleList)
                .flatMap(aPackage -> {
                    // TODO: What happens if this instance has also created a package from this unique ref,
                    //  and has reached this version, but with a separate interface/definition ?
                    return crudModuleService
                            .getAllModules(aPackage.getId(), modulePermission.getReadPermission())
                            .doOnNext(module -> {
                                moduleUUIDToModuleMap.put(module.getModuleUUID(), module);
                            })
                            .collectList();
                })
                .then();
    }

    private void renamePageInModuleInstances(
            List<ModuleInstance> moduleInstanceList, String oldPageName, String newPageName) {
        for (ModuleInstance moduleInstance : moduleInstanceList) {
            if (moduleInstance.getUnpublishedModuleInstance().getPageId().equals(oldPageName)) {
                moduleInstance.getUnpublishedModuleInstance().setPageId(newPageName);
            }
        }
    }

    private Mono<ImportModuleInstanceResultDTO> importModuleInstances(
            List<ModuleInstance> moduleInstanceList,
            ImportableArtifact importableArtifact,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        Mono<Map<String, ModuleInstance>> moduleInstancesInCurrentAppMono =
                getModuleInstancesInCurrentAppMono(importableArtifact).collectMap(ModuleInstance::getGitSyncId);

        Mono<Map<String, ModuleInstance>> moduleInstancesInBranchesMono;
        if (importableArtifact.getGitArtifactMetadata() != null) {
            final String defaultApplicationId =
                    importableArtifact.getGitArtifactMetadata().getDefaultArtifactId();
            moduleInstancesInBranchesMono = repository
                    .findByDefaultApplicationId(defaultApplicationId, Optional.empty())
                    .filter(moduleInstance ->
                            !Objects.equals(moduleInstance.getApplicationId(), importableArtifact.getId()))
                    .filter(moduleInstance -> moduleInstance.getGitSyncId() != null)
                    .collectMap(ModuleInstance::getGitSyncId);
        } else {
            moduleInstancesInBranchesMono = Mono.just(Collections.emptyMap());
        }

        return Mono.zip(moduleInstancesInCurrentAppMono, moduleInstancesInBranchesMono)
                .flatMap(tuple2 -> {
                    Map<String, ModuleInstance> moduleInstancesInCurrentApp = tuple2.getT1();
                    Map<String, ModuleInstance> moduleInstancesInBranches = tuple2.getT2();

                    List<ModuleInstance> updatableModuleInstanceList = new ArrayList<>();
                    ImportModuleInstanceResultDTO importModuleInstanceResultDTO = new ImportModuleInstanceResultDTO();
                    importModuleInstanceResultDTO.setExistingModuleInstances(moduleInstancesInCurrentApp.values());

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

                        if (importableArtifact.getGitArtifactMetadata() != null) {
                            final String defaultApplicationId =
                                    importableArtifact.getGitArtifactMetadata().getDefaultArtifactId();
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
                                moduleInstance.getDefaultResources().setModuleInstanceId(null);
                                moduleInstance.setId(null);
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
                            parentPage = updatePageInModuleInstance(unpublishedModuleInstance, (Map<String, NewPage>)
                                    mappedImportableResourcesDTO.getContextMap());
                            unpublishedModuleInstance.setVersion(unpublishedModuleInstance.getVersion());
                            unpublishedModuleInstance.setContextId(unpublishedModuleInstance.getPageId());
                        }

                        if (publishedModuleInstance != null && publishedModuleInstance.getName() != null) {
                            publishedModuleInstance.setId(moduleInstance.getId());
                            if (!StringUtils.hasLength(publishedModuleInstance.getPageId())) {
                                publishedModuleInstance.setPageId(fallbackParentPageId);
                            }
                            NewPage publishedModuleInstancePage =
                                    updatePageInModuleInstance(publishedModuleInstance, (Map<String, NewPage>)
                                            mappedImportableResourcesDTO.getContextMap());
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
                            updatableModuleInstanceList.add(existingInstance);

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
                            .bulkUpdate(updatableModuleInstanceList)
                            .then(Mono.defer(() -> {
                                if (importingMetaDTO.getBranchName() != null) {
                                    return updateDefaultResourcesForPrivateCompositeEntities(
                                                    updatableModuleInstanceList, importingMetaDTO)
                                            .thenReturn(updatableModuleInstanceList);
                                } else {
                                    return Mono.just(updatableModuleInstanceList);
                                }
                            }));

                    // Save all the new module instances in bulk
                    return bulkInsertMono.zipWith(bulkUpdateMono).thenReturn(importModuleInstanceResultDTO);
                });
    }

    private Mono<Void> updateDefaultResourcesForPrivateCompositeEntities(
            List<ModuleInstance> moduleInstanceList, ImportingMetaDTO importingMetaDTO) {
        Mono<Map<String, String>> moduleInstanceIdsCache = Flux.fromIterable(moduleInstanceList)
                .collectMap(
                        ModuleInstance::getId,
                        moduleInstance -> moduleInstance.getDefaultResources().getModuleInstanceId())
                .cache();

        Map<String, String> branchedToDefaultActionIds = new ConcurrentHashMap<>();

        Mono<List<List<NewAction>>> updatedActionsMono = moduleInstanceIdsCache
                .flatMapIterable(Map::entrySet)
                .flatMap(entry -> {
                    String existingModuleInstanceId = entry.getKey();
                    String defaultModuleInstanceId = entry.getValue();
                    Mono<Map<String, NewAction>> defaultActionsMapMono = newActionService
                            .findAllUnpublishedComposedActionsByRootModuleInstanceId(
                                    defaultModuleInstanceId, null, true)
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

                                        branchedToDefaultActionIds.put(newAction.getId(), defaultNewAction.getId());
                                        newAction.setGitSyncId(defaultNewAction.getGitSyncId());
                                    }
                                })
                                .collectList()
                                .flatMapMany(newActionService::saveAll)
                                .collectList();
                    });
                })
                .collectList();

        Mono<List<List<ActionCollection>>> updatedCollectionsMono = moduleInstanceIdsCache
                .flatMapIterable(Map::entrySet)
                .flatMap(entry -> {
                    String existingModuleInstanceId = entry.getKey();
                    String defaultModuleInstanceId = entry.getValue();

                    Mono<Map<String, ActionCollection>> defaultCollectionsMapMono = actionCollectionService
                            .findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(
                                    defaultModuleInstanceId, null)
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
                                        Map<String, String> defaultToBranchedActionIdsMap = actionCollection
                                                .getUnpublishedCollection()
                                                .getDefaultToBranchedActionIdsMap();
                                        Map<String, String> newDefaultToBranchedActionIdsMap = new HashMap<>();

                                        defaultToBranchedActionIdsMap.keySet().forEach(branchedActionId -> {
                                            String defaultActionId = branchedToDefaultActionIds.getOrDefault(
                                                    branchedActionId, branchedActionId);
                                            newDefaultToBranchedActionIdsMap.put(defaultActionId, branchedActionId);
                                        });

                                        actionCollection
                                                .getUnpublishedCollection()
                                                .setDefaultToBranchedActionIdsMap(newDefaultToBranchedActionIdsMap);
                                        actionCollection.setGitSyncId(defaultActionCollection.getGitSyncId());
                                    }
                                })
                                .collectList()
                                .flatMapMany(actionCollectionService::saveAll)
                                .collectList();
                    });
                })
                .collectList();

        return updatedActionsMono.then(updatedCollectionsMono).then();
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

    private Flux<ModuleInstance> getModuleInstancesInCurrentAppMono(ImportableArtifact importedApplication) {
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
        moduleInstanceDTO.setId(null);
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
        moduleInstanceDTO.setWorkspaceId(importingMetaDTO.getWorkspaceId());

        if (TRUE.equals(moduleInstanceDTO.getIsValid())) {
            return crudModuleInstanceService.createModuleInstance(moduleInstanceDTO, importingMetaDTO.getBranchName());
        } else {
            return crudModuleInstanceService.createOrphanModuleInstance(
                    moduleInstanceDTO, importingMetaDTO.getBranchName());
        }
    }

    private NewPage updatePageInModuleInstance(ModuleInstanceDTO moduleInstanceDTO, Map<String, NewPage> pageNameMap) {
        NewPage parentPage = pageNameMap.get(moduleInstanceDTO.getPageId());
        if (moduleInstanceDTO.getDefaultResources() != null
                && moduleInstanceDTO.getDefaultResources().getPageId() != null
                && pageNameMap.containsKey(
                        moduleInstanceDTO.getDefaultResources().getPageId())) {
            NewPage defaultPage =
                    pageNameMap.get(moduleInstanceDTO.getDefaultResources().getPageId());
            moduleInstanceDTO
                    .getDefaultResources()
                    .setPageId(defaultPage.getDefaultResources().getPageId());
        }
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
        if (moduleUUIDToModuleMap.containsKey(moduleInstance.getModuleUUID())
                && moduleUUIDToModuleMap
                        .get(moduleInstance.getModuleUUID())
                        .getVersion()
                        .equals(moduleInstanceDTO.getVersion())) {
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
