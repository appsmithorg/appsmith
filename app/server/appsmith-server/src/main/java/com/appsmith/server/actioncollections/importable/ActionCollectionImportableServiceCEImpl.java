package com.appsmith.server.actioncollections.importable;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportActionCollectionResultDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Slf4j
@RequiredArgsConstructor
public class ActionCollectionImportableServiceCEImpl implements ImportableServiceCE<ActionCollection> {
    private final ActionCollectionRepository repository;
    protected final ArtifactBasedImportableService<ActionCollection, Application> applicationImportableService;

    @Override
    public ArtifactBasedImportableService<ActionCollection, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        return applicationImportableService;
    }

    // Requires contextNameMap, contextNameToOldNameMap, pluginMap and actionResultDTO to be present in importable
    // resources.
    // Updates actionCollectionResultDTO in importable resources.
    // Also, directly updates required information in DB
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        List<ActionCollection> importedActionCollectionList =
                CollectionUtils.isEmpty(artifactExchangeJson.getActionCollectionList())
                        ? new ArrayList<>()
                        : artifactExchangeJson.getActionCollectionList();

        Mono<ImportActionCollectionResultDTO> importActionCollectionMono = createImportActionCollectionMono(
                importedActionCollectionList, importableArtifactMono, importingMetaDTO, mappedImportableResourcesDTO);

        return importActionCollectionMono.then();
    }

    private Mono<ImportActionCollectionResultDTO> createImportActionCollectionMono(
            List<ActionCollection> importedActionCollectionList,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ArtifactBasedImportableService<ActionCollection, ?> artifactBasedExportableService =
                getArtifactBasedImportableService(importingMetaDTO);

        Mono<List<ActionCollection>> importedActionCollectionMono = Mono.just(importedActionCollectionList);

        if (importingMetaDTO.getAppendToArtifact()) {
            importedActionCollectionMono = importedActionCollectionMono.map(importedActionCollections -> {
                List<String> importedContextNames =
                        artifactBasedExportableService.getImportedContextNames(mappedImportableResourcesDTO);
                Map<String, String> newToOldNameMap = mappedImportableResourcesDTO.getContextNewNameToOldName();

                for (String newContextName : importedContextNames) {
                    String oldContextName = newToOldNameMap.get(newContextName);

                    if (!newContextName.equals(oldContextName)) {
                        artifactBasedExportableService.renameContextInImportableResources(
                                importedActionCollections, oldContextName, newContextName);
                    }
                }
                return importedActionCollections;
            });
        }

        return Mono.zip(importableArtifactMono, importedActionCollectionMono)
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

    /**
     * Method to
     * - save imported actionCollections with updated policies
     * - update default resource ids along with branch-name if the importableArtifact is connected to git
     *
     * @param importedActionCollectionList action list extracted from the imported JSON file
     * @param importableArtifact           imported and saved importableArtifact in DB
     * @return tuple of imported actionCollectionId and saved actionCollection in DB
     */
    private Mono<ImportActionCollectionResultDTO> importActionCollections(
            ImportableArtifact importableArtifact,
            List<ActionCollection> importedActionCollectionList,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ArtifactBasedImportableService<ActionCollection, ?> artifactBasedExportableService =
                getArtifactBasedImportableService(importingMetaDTO);

        /* Mono.just(importableArtifact) is created to avoid the eagerly fetching of existing actionCollections
         * during the pipeline construction. It should be fetched only when the pipeline is subscribed/executed.
         */
        return Mono.just(importableArtifact)
                .flatMap(artifact -> {
                    ImportActionCollectionResultDTO resultDTO = new ImportActionCollectionResultDTO();
                    mappedImportableResourcesDTO.setActionCollectionResultDTO(resultDTO);

                    // Map of gitSyncId to actionCollection of the existing records in DB
                    Mono<Map<String, ActionCollection>> actionCollectionsInCurrentArtifactMono =
                            artifactBasedExportableService
                                    .getExistingResourcesInCurrentArtifactFlux(artifact)
                                    .filter(collection -> collection.getGitSyncId() != null)
                                    .collectMap(ActionCollection::getGitSyncId);

                    Mono<Map<String, ActionCollection>> actionCollectionsInBranchesMono;
                    if (artifact.getGitArtifactMetadata() != null) {
                        final String defaultArtifactId =
                                artifact.getGitArtifactMetadata().getDefaultArtifactId();
                        actionCollectionsInBranchesMono = artifactBasedExportableService
                                .getExistingResourcesInOtherBranchesFlux(defaultArtifactId, artifact.getId())
                                .filter(actionCollection -> actionCollection.getGitSyncId() != null)
                                .collectMap(ActionCollection::getGitSyncId);
                    } else {
                        actionCollectionsInBranchesMono = Mono.just(Collections.emptyMap());
                    }

                    // update the action collection name in the json to avoid duplicate names for the partial import
                    // It is context level action and hence the action name should be unique
                    if (Boolean.TRUE.equals(importingMetaDTO.getIsPartialImport())
                            && mappedImportableResourcesDTO.getRefactoringNameReference() != null) {
                        updateActionCollectionNameBeforeMerge(
                                importedActionCollectionList,
                                mappedImportableResourcesDTO.getRefactoringNameReference());
                    }

                    return Mono.zip(actionCollectionsInCurrentArtifactMono, actionCollectionsInBranchesMono)
                            .flatMap(objects -> {
                                Map<String, ActionCollection> actionsCollectionsInCurrentArtifact = objects.getT1();
                                Map<String, ActionCollection> actionsCollectionsInBranches = objects.getT2();

                                // set the existing action collections in the result DTO,
                                // this will be required in next phases when we'll delete the outdated action
                                // collections
                                resultDTO.setExistingActionCollections(actionsCollectionsInCurrentArtifact.values());

                                List<ActionCollection> newActionCollections = new ArrayList<>();
                                List<ActionCollection> existingActionCollections = new ArrayList<>();

                                for (ActionCollection actionCollection : importedActionCollectionList) {
                                    final ActionCollectionDTO unpublishedCollection =
                                            actionCollection.getUnpublishedCollection();
                                    if (unpublishedCollection == null
                                            || StringUtils.isEmpty(unpublishedCollection.calculateContextId())) {
                                        continue; // invalid action collection, skip it
                                    }

                                    String idFromJsonFile = actionCollection.getId();

                                    ActionCollection branchedActionCollection = null;

                                    if (actionsCollectionsInBranches.containsKey(actionCollection.getGitSyncId())) {
                                        branchedActionCollection =
                                                getExistingCollectionInOtherBranchesForImportedCollection(
                                                        mappedImportableResourcesDTO,
                                                        actionsCollectionsInBranches,
                                                        actionCollection);
                                    }

                                    Context defaultContext = populateIdReferencesAndReturnDefaultContext(
                                            importingMetaDTO,
                                            mappedImportableResourcesDTO,
                                            artifact,
                                            branchedActionCollection,
                                            actionCollection);

                                    // Check if the action has gitSyncId and if it's already in DB
                                    if (existingArtifactContainsCollection(
                                            actionsCollectionsInCurrentArtifact, actionCollection)) {

                                        // Since the resource is already present in DB, just update resource
                                        ActionCollection existingActionCollection =
                                                getExistingCollectionInCurrentBranchForImportedCollection(
                                                        mappedImportableResourcesDTO,
                                                        actionsCollectionsInCurrentArtifact,
                                                        actionCollection);

                                        updateExistingCollection(
                                                importingMetaDTO,
                                                mappedImportableResourcesDTO,
                                                actionCollection,
                                                existingActionCollection);

                                        existingActionCollections.add(existingActionCollection);
                                        resultDTO.getSavedActionCollectionIds().add(existingActionCollection.getId());
                                        resultDTO
                                                .getSavedActionCollectionMap()
                                                .put(idFromJsonFile, existingActionCollection);
                                    } else {
                                        artifactBasedExportableService.createNewResource(
                                                importingMetaDTO, actionCollection, defaultContext);

                                        populateDomainMappedReferences(mappedImportableResourcesDTO, actionCollection);

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

    private Context populateIdReferencesAndReturnDefaultContext(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportableArtifact artifact,
            ActionCollection branchedActionCollection,
            ActionCollection actionCollection) {

        ArtifactBasedImportableService<ActionCollection, ?> artifactBasedExportableService =
                this.getArtifactBasedImportableService(importingMetaDTO);

        String idFromJsonFile = actionCollection.getId();
        String workspaceId = importingMetaDTO.getWorkspaceId();
        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
        ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();
        Context parentContext = null;

        // If contextId is missing in the actionCollectionDTO create a fallback contextId
        final String fallbackDefaultContextId = unpublishedCollection.calculateContextId();

        if (unpublishedCollection.getName() != null) {
            unpublishedCollection.setDefaultToBranchedActionIdsMap(mappedImportableResourcesDTO
                    .getActionResultDTO()
                    .getUnpublishedCollectionIdToActionIdsMap()
                    .get(idFromJsonFile));
            unpublishedCollection.setPluginId(
                    mappedImportableResourcesDTO.getPluginMap().get(unpublishedCollection.getPluginId()));

            parentContext = artifactBasedExportableService.updateContextInResource(
                    unpublishedCollection, mappedImportableResourcesDTO.getContextMap(), fallbackDefaultContextId);
        }

        if (publishedCollection != null && publishedCollection.getName() != null) {
            publishedCollection.setDefaultToBranchedActionIdsMap(mappedImportableResourcesDTO
                    .getActionResultDTO()
                    .getPublishedCollectionIdToActionIdsMap()
                    .get(idFromJsonFile));
            publishedCollection.setPluginId(
                    mappedImportableResourcesDTO.getPluginMap().get(publishedCollection.getPluginId()));

            Context publishedCollectionContext = artifactBasedExportableService.updateContextInResource(
                    publishedCollection, mappedImportableResourcesDTO.getContextMap(), fallbackDefaultContextId);
            parentContext = parentContext == null ? publishedCollectionContext : parentContext;
        }

        actionCollection.makePristine();
        actionCollection.setWorkspaceId(workspaceId);

        artifactBasedExportableService.populateDefaultResources(
                importingMetaDTO, mappedImportableResourcesDTO, artifact, branchedActionCollection, actionCollection);
        return parentContext;
    }

    private void updateActionCollectionNameBeforeMerge(
            List<ActionCollection> importedNewActionCollectionList, Set<String> refactoringNameSet) {

        for (ActionCollection actionCollection : importedNewActionCollectionList) {
            String
                    oldNameActionCollection =
                            actionCollection.getUnpublishedCollection().getName(),
                    newNameActionCollection =
                            actionCollection.getUnpublishedCollection().getName();
            int i = 1;
            while (refactoringNameSet.contains(newNameActionCollection)) {
                newNameActionCollection = oldNameActionCollection + i++;
            }
            String oldId = actionCollection.getId().split("_")[1];
            actionCollection.setId(newNameActionCollection + "_" + oldId);
            actionCollection.getUnpublishedCollection().setName(newNameActionCollection);
            if (actionCollection.getPublishedCollection() != null) {
                actionCollection.getPublishedCollection().setName(newNameActionCollection);
            }
        }
    }

    private void updateExistingCollection(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ActionCollection actionCollection,
            ActionCollection existingActionCollection) {
        Set<Policy> existingPolicy = existingActionCollection.getPolicies();

        updateImportableCollectionFromExistingCollection(existingActionCollection, actionCollection);

        copyNestedNonNullProperties(actionCollection, existingActionCollection);

        populateDomainMappedReferences(mappedImportableResourcesDTO, existingActionCollection);

        // Update branchName
        existingActionCollection.getDefaultResources().setBranchName(importingMetaDTO.getBranchName());
        // Recover the deleted state present in DB from imported actionCollection
        existingActionCollection
                .getUnpublishedCollection()
                .setDeletedAt(actionCollection.getUnpublishedCollection().getDeletedAt());
        existingActionCollection.setDeletedAt(actionCollection.getDeletedAt());
        existingActionCollection.setPolicies(existingPolicy);

        existingActionCollection.updateForBulkWriteOperation();
    }

    protected void updateImportableCollectionFromExistingCollection(
            ActionCollection existingActionCollection, ActionCollection actionCollection) {
        // Nothing to update from the existing action collection
    }

    protected ActionCollection getExistingCollectionInCurrentBranchForImportedCollection(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, ActionCollection> actionsCollectionsInCurrentArtifact,
            ActionCollection actionCollection) {
        return actionsCollectionsInCurrentArtifact.get(actionCollection.getGitSyncId());
    }

    protected ActionCollection getExistingCollectionInOtherBranchesForImportedCollection(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, ActionCollection> actionsCollectionsInCurrentArtifact,
            ActionCollection actionCollection) {
        return actionsCollectionsInCurrentArtifact.get(actionCollection.getGitSyncId());
    }

    protected boolean existingArtifactContainsCollection(
            Map<String, ActionCollection> actionsCollectionsInCurrentArtifact, ActionCollection actionCollection) {
        return actionCollection.getGitSyncId() != null
                && actionsCollectionsInCurrentArtifact.containsKey(actionCollection.getGitSyncId());
    }

    protected void populateDomainMappedReferences(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, ActionCollection actionCollection) {
        // Nothing needs to be copied into the action collection from mapped resources
    }
}
