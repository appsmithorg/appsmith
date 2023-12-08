package com.appsmith.server.actioncollections.imports;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportActionCollectionResultDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.repositories.ActionCollectionRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Slf4j
public class ActionCollectionImportableServiceCEImpl implements ImportableServiceCE<ActionCollection> {
    private final ActionCollectionService actionCollectionService;
    private final ActionCollectionRepository repository;

    public ActionCollectionImportableServiceCEImpl(
            ActionCollectionService actionCollectionService, ActionCollectionRepository repository) {
        this.actionCollectionService = actionCollectionService;
        this.repository = repository;
    }

    // Requires pageNameMap, pageNameToOldNameMap, pluginMap and actionResultDTO to be present in importable resources.
    // Updates actionCollectionResultDTO in importable resources.
    // Also directly updates required information in DB
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson,
            boolean isPartialImport) {
        List<ActionCollection> importedActionCollectionList =
                CollectionUtils.isEmpty(applicationJson.getActionCollectionList())
                        ? new ArrayList<>()
                        : applicationJson.getActionCollectionList();

        Mono<ImportActionCollectionResultDTO> importActionCollectionMono = createImportActionCollectionMono(
                importedActionCollectionList, applicationMono, importingMetaDTO, mappedImportableResourcesDTO);

        return importActionCollectionMono
                .doOnNext(mappedImportableResourcesDTO::setActionCollectionResultDTO)
                .then();
    }

    private Mono<ImportActionCollectionResultDTO> createImportActionCollectionMono(
            List<ActionCollection> importedActionCollectionList,
            Mono<Application> importApplicationMono,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        Mono<List<ActionCollection>> importedActionCollectionMono = Mono.just(importedActionCollectionList);

        if (importingMetaDTO.getAppendToApp()) {
            importedActionCollectionMono = importedActionCollectionMono.map(importedActionCollectionList1 -> {
                List<NewPage> importedNewPages = mappedImportableResourcesDTO.getPageNameMap().values().stream()
                        .distinct()
                        .toList();
                Map<String, String> newToOldNameMap = mappedImportableResourcesDTO.getNewPageNameToOldPageNameMap();

                for (NewPage newPage : importedNewPages) {
                    String newPageName = newPage.getUnpublishedPage().getName();
                    String oldPageName = newToOldNameMap.get(newPageName);

                    if (!newPageName.equals(oldPageName)) {
                        renamePageInActionCollections(importedActionCollectionList1, oldPageName, newPageName);
                    }
                }
                return importedActionCollectionList1;
            });
        }

        return Mono.zip(importApplicationMono, importedActionCollectionMono)
                .flatMap(objects -> {
                    log.info("Importing action collections");
                    return this.importActionCollections(
                            objects.getT1(), objects.getT2(), importingMetaDTO, mappedImportableResourcesDTO);
                })
                .onErrorResume(throwable -> {
                    log.error("Error importing action collections", throwable);
                    return Mono.error(throwable);
                });
    }

    private void renamePageInActionCollections(
            List<ActionCollection> actionCollectionList, String oldPageName, String newPageName) {
        for (ActionCollection actionCollection : actionCollectionList) {
            if (actionCollection.getUnpublishedCollection().getPageId().equals(oldPageName)) {
                actionCollection.getUnpublishedCollection().setPageId(newPageName);
            }
        }
    }

    /**
     * Method to
     * - save imported actionCollections with updated policies
     * - update default resource ids along with branch-name if the application is connected to git
     *
     * @param importedActionCollectionList          action list extracted from the imported JSON file
     * @param application                   imported and saved application in DB
     * @return tuple of imported actionCollectionId and saved actionCollection in DB
     */
    private Mono<ImportActionCollectionResultDTO> importActionCollections(
            Application application,
            List<ActionCollection> importedActionCollectionList,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        /* Mono.just(application) is created to avoid the eagerly fetching of existing actionCollections
         * during the pipeline construction. It should be fetched only when the pipeline is subscribed/executed.
         */
        return Mono.just(application)
                .flatMap(importedApplication -> {
                    ImportActionCollectionResultDTO resultDTO = new ImportActionCollectionResultDTO();
                    final String workspaceId = importedApplication.getWorkspaceId();

                    // Map of gitSyncId to actionCollection of the existing records in DB
                    Mono<Map<String, ActionCollection>> actionCollectionsInCurrentAppMono = repository
                            .findByApplicationId(importedApplication.getId())
                            .filter(collection -> collection.getGitSyncId() != null)
                            .collectMap(ActionCollection::getGitSyncId);

                    Mono<Map<String, ActionCollection>> actionCollectionsInBranchesMono;
                    if (importedApplication.getGitApplicationMetadata() != null) {
                        final String defaultApplicationId =
                                importedApplication.getGitApplicationMetadata().getDefaultApplicationId();
                        actionCollectionsInBranchesMono = repository
                                .findByDefaultApplicationId(defaultApplicationId, Optional.empty())
                                .filter(actionCollection -> actionCollection.getGitSyncId() != null)
                                .collectMap(ActionCollection::getGitSyncId);
                    } else {
                        actionCollectionsInBranchesMono = Mono.just(Collections.emptyMap());
                    }

                    return Mono.zip(actionCollectionsInCurrentAppMono, actionCollectionsInBranchesMono)
                            .flatMap(objects -> {
                                Map<String, ActionCollection> actionsCollectionsInCurrentApp = objects.getT1();
                                Map<String, ActionCollection> actionsCollectionsInBranches = objects.getT2();

                                // set the existing action collections in the result DTO, this will be required in next
                                // phases
                                resultDTO.setExistingActionCollections(actionsCollectionsInCurrentApp.values());

                                List<ActionCollection> newActionCollections = new ArrayList<>();
                                List<ActionCollection> existingActionCollections = new ArrayList<>();

                                for (ActionCollection actionCollection : importedActionCollectionList) {
                                    if (actionCollection.getUnpublishedCollection() == null
                                            || StringUtils.isEmpty(actionCollection
                                                    .getUnpublishedCollection()
                                                    .getPageId())) {
                                        continue; // invalid action collection, skip it
                                    }
                                    final String idFromJsonFile = actionCollection.getId();
                                    NewPage parentPage = new NewPage();
                                    final ActionCollectionDTO unpublishedCollection =
                                            actionCollection.getUnpublishedCollection();
                                    final ActionCollectionDTO publishedCollection =
                                            actionCollection.getPublishedCollection();

                                    // If pageId is missing in the actionCollectionDTO create a fallback pageId
                                    final String fallbackParentPageId = unpublishedCollection.getPageId();

                                    if (unpublishedCollection.getName() != null) {
                                        unpublishedCollection.setDefaultToBranchedActionIdsMap(
                                                mappedImportableResourcesDTO
                                                        .getActionResultDTO()
                                                        .getUnpublishedCollectionIdToActionIdsMap()
                                                        .get(idFromJsonFile));
                                        unpublishedCollection.setPluginId(mappedImportableResourcesDTO
                                                .getPluginMap()
                                                .get(unpublishedCollection.getPluginId()));
                                        parentPage = updatePageInActionCollection(
                                                unpublishedCollection, mappedImportableResourcesDTO.getPageNameMap());
                                    }

                                    if (publishedCollection != null && publishedCollection.getName() != null) {
                                        publishedCollection.setDefaultToBranchedActionIdsMap(
                                                mappedImportableResourcesDTO
                                                        .getActionResultDTO()
                                                        .getPublishedCollectionIdToActionIdsMap()
                                                        .get(idFromJsonFile));
                                        publishedCollection.setPluginId(mappedImportableResourcesDTO
                                                .getPluginMap()
                                                .get(publishedCollection.getPluginId()));
                                        if (StringUtils.isEmpty(publishedCollection.getPageId())) {
                                            publishedCollection.setPageId(fallbackParentPageId);
                                        }
                                        NewPage publishedCollectionPage = updatePageInActionCollection(
                                                publishedCollection, mappedImportableResourcesDTO.getPageNameMap());
                                        parentPage = parentPage == null ? publishedCollectionPage : parentPage;
                                    }

                                    actionCollection.makePristine();
                                    actionCollection.setWorkspaceId(workspaceId);
                                    actionCollection.setApplicationId(importedApplication.getId());

                                    // Check if the action has gitSyncId and if it's already in DB
                                    if (actionCollection.getGitSyncId() != null
                                            && actionsCollectionsInCurrentApp.containsKey(
                                                    actionCollection.getGitSyncId())) {

                                        // Since the resource is already present in DB, just update resource
                                        ActionCollection existingActionCollection =
                                                actionsCollectionsInCurrentApp.get(actionCollection.getGitSyncId());

                                        Set<Policy> existingPolicy = existingActionCollection.getPolicies();
                                        copyNestedNonNullProperties(actionCollection, existingActionCollection);
                                        // Update branchName
                                        existingActionCollection
                                                .getDefaultResources()
                                                .setBranchName(importingMetaDTO.getBranchName());
                                        // Recover the deleted state present in DB from imported actionCollection
                                        existingActionCollection
                                                .getUnpublishedCollection()
                                                .setDeletedAt(actionCollection
                                                        .getUnpublishedCollection()
                                                        .getDeletedAt());
                                        existingActionCollection.setDeletedAt(actionCollection.getDeletedAt());
                                        existingActionCollection.setDeleted(actionCollection.getDeleted());
                                        existingActionCollection.setPolicies(existingPolicy);

                                        existingActionCollection.updateForBulkWriteOperation();
                                        existingActionCollections.add(existingActionCollection);
                                        resultDTO.getSavedActionCollectionIds().add(existingActionCollection.getId());
                                        resultDTO
                                                .getSavedActionCollectionMap()
                                                .put(idFromJsonFile, existingActionCollection);
                                    } else {
                                        if (!importingMetaDTO
                                                .getPermissionProvider()
                                                .canCreateAction(parentPage)) {
                                            throw new AppsmithException(
                                                    AppsmithError.ACL_NO_RESOURCE_FOUND,
                                                    FieldName.PAGE,
                                                    parentPage.getId());
                                        }

                                        if (importedApplication.getGitApplicationMetadata() != null) {
                                            final String defaultApplicationId = importedApplication
                                                    .getGitApplicationMetadata()
                                                    .getDefaultApplicationId();
                                            if (actionsCollectionsInBranches.containsKey(
                                                    actionCollection.getGitSyncId())) {
                                                ActionCollection branchedActionCollection =
                                                        actionsCollectionsInBranches.get(
                                                                actionCollection.getGitSyncId());
                                                actionCollectionService.populateDefaultResources(
                                                        actionCollection,
                                                        branchedActionCollection,
                                                        importingMetaDTO.getBranchName());
                                            } else {
                                                DefaultResources defaultResources = new DefaultResources();
                                                defaultResources.setApplicationId(defaultApplicationId);
                                                defaultResources.setBranchName(importingMetaDTO.getBranchName());
                                                actionCollection.setDefaultResources(defaultResources);
                                            }
                                        }

                                        // this will generate the id and other auto generated fields e.g. createdAt
                                        actionCollection.updateForBulkWriteOperation();
                                        actionCollectionService.generateAndSetPolicies(parentPage, actionCollection);

                                        // create or update default resources for the action
                                        // values already set to defaultResources are kept unchanged
                                        DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(
                                                actionCollection, importingMetaDTO.getBranchName());

                                        // generate gitSyncId if it's not present
                                        if (actionCollection.getGitSyncId() == null) {
                                            actionCollection.setGitSyncId(
                                                    actionCollection.getApplicationId() + "_" + new ObjectId());
                                        }

                                        // it's new actionCollection
                                        newActionCollections.add(actionCollection);
                                        resultDTO.getSavedActionCollectionIds().add(actionCollection.getId());
                                        resultDTO.getSavedActionCollectionMap().put(idFromJsonFile, actionCollection);
                                    }
                                }
                                log.info(
                                        "Saving action collections in bulk. New: {}, Updated: {}",
                                        newActionCollections.size(),
                                        existingActionCollections.size());
                                return repository
                                        .bulkInsert(newActionCollections)
                                        .then(repository.bulkUpdate(existingActionCollections))
                                        .thenReturn(resultDTO);
                            });
                })
                .onErrorResume(e -> {
                    log.error("Error saving action collections", e);
                    return Mono.error(e);
                });
    }

    private NewPage updatePageInActionCollection(ActionCollectionDTO collectionDTO, Map<String, NewPage> pageNameMap) {
        NewPage parentPage = pageNameMap.get(collectionDTO.getPageId());
        if (parentPage == null) {
            return null;
        }
        collectionDTO.setPageId(parentPage.getId());

        // Update defaultResources in actionCollectionDTO
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(parentPage.getDefaultResources().getPageId());
        collectionDTO.setDefaultResources(defaultResources);

        return parentPage;
    }
}
