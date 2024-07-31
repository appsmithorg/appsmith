package com.appsmith.server.actioncollections.importable;

import com.appsmith.external.models.Policy;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Context;
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
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActionCollectionImportableServiceCEImpl implements ImportableServiceCE<ActionCollection> {

    private final ActionCollectionService actionCollectionService;
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
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        Mono<List<ActionCollection>> importedActionCollectionListMono = getImportableEntities(artifactExchangeJson);

        Mono<ImportActionCollectionResultDTO> importActionCollectionMono = importedActionCollectionListMono.flatMap(
                importedActionCollectionList -> createImportActionCollectionMono(
                        importedActionCollectionList,
                        importableArtifactMono,
                        importingMetaDTO,
                        mappedImportableResourcesDTO));

        return importActionCollectionMono.then();
    }

    private Mono<ImportActionCollectionResultDTO> createImportActionCollectionMono(
            List<ActionCollection> importedActionCollectionList,
            Mono<? extends Artifact> importableArtifactMono,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ArtifactBasedImportableService<ActionCollection, ?> artifactBasedImportableService =
                getArtifactBasedImportableService(importingMetaDTO);

        Mono<List<ActionCollection>> importedActionCollectionMono = Mono.just(importedActionCollectionList);

        if (importingMetaDTO.getAppendToArtifact()) {
            importedActionCollectionMono = importedActionCollectionMono.map(importedActionCollections -> {
                List<String> importedContextNames =
                        artifactBasedImportableService.getImportedContextNames(mappedImportableResourcesDTO);
                Map<String, String> newToOldNameMap = mappedImportableResourcesDTO.getContextNewNameToOldName();

                for (String newContextName : importedContextNames) {
                    String oldContextName = newToOldNameMap.get(newContextName);

                    if (!newContextName.equals(oldContextName)) {
                        artifactBasedImportableService.renameContextInImportableResources(
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
            Artifact importableArtifact,
            List<ActionCollection> importedActionCollectionList,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ArtifactBasedImportableService<ActionCollection, ?> artifactBasedImportableService =
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
                            artifactBasedImportableService
                                    .getExistingResourcesInCurrentArtifactFlux(artifact)
                                    .filter(collection -> collection.getGitSyncId() != null)
                                    .collectMap(ActionCollection::getGitSyncId);

                    Mono<Map<String, ActionCollection>> actionCollectionsInBranchesMono;
                    if (artifact.getGitArtifactMetadata() != null) {
                        actionCollectionsInBranchesMono = artifactBasedImportableService
                                .getExistingResourcesInOtherBranchesFlux(
                                        importingMetaDTO.getBranchedArtifactIds(), artifact.getId())
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
                                importedActionCollectionList, mappedImportableResourcesDTO);
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
                                                artifactBasedImportableService
                                                        .getExistingEntityInOtherBranchForImportedEntity(
                                                                mappedImportableResourcesDTO,
                                                                actionsCollectionsInBranches,
                                                                actionCollection);
                                    }

                                    Context baseContext = populateIdReferencesAndReturnBaseContext(
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
                                                artifactBasedImportableService
                                                        .getExistingEntityInCurrentBranchForImportedEntity(
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
                                        artifactBasedImportableService.createNewResource(
                                                importingMetaDTO, actionCollection, baseContext);

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
                                return Mono.when(
                                                actionCollectionService
                                                        .bulkValidateAndInsertActionCollectionInRepository(
                                                                newActionCollections),
                                                actionCollectionService
                                                        .bulkValidateAndUpdateActionCollectionInRepository(
                                                                existingActionCollections))
                                        .thenReturn(resultDTO);
                            });
                })
                .onErrorResume(e -> {
                    log.error("Error saving action collections", e);
                    return Mono.error(e);
                });
    }

    private Context populateIdReferencesAndReturnBaseContext(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Artifact artifact,
            ActionCollection branchedActionCollection,
            ActionCollection actionCollection) {

        ArtifactBasedImportableService<ActionCollection, ?> artifactBasedImportableService =
                this.getArtifactBasedImportableService(importingMetaDTO);

        String idFromJsonFile = actionCollection.getId();
        String workspaceId = importingMetaDTO.getWorkspaceId();
        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
        ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();
        Context parentContext = null;

        // If contextId is missing in the actionCollectionDTO create a fallback contextId
        final String fallbackBaseContextId = unpublishedCollection.calculateContextId();

        if (unpublishedCollection.getName() != null) {
            unpublishedCollection.setPluginId(
                    mappedImportableResourcesDTO.getPluginMap().get(unpublishedCollection.getPluginId()));

            parentContext = artifactBasedImportableService.updateContextInResource(
                    unpublishedCollection, mappedImportableResourcesDTO.getContextMap(), fallbackBaseContextId);
        }

        if (publishedCollection != null && publishedCollection.getName() != null) {
            publishedCollection.setPluginId(
                    mappedImportableResourcesDTO.getPluginMap().get(publishedCollection.getPluginId()));

            Context publishedCollectionContext = artifactBasedImportableService.updateContextInResource(
                    publishedCollection, mappedImportableResourcesDTO.getContextMap(), fallbackBaseContextId);
            parentContext = parentContext == null ? publishedCollectionContext : parentContext;
        }

        actionCollection.makePristine();
        actionCollection.setWorkspaceId(workspaceId);

        artifactBasedImportableService.updateArtifactId(actionCollection, artifact);

        artifactBasedImportableService.populateBaseId(
                importingMetaDTO, artifact, branchedActionCollection, actionCollection);
        return parentContext;
    }

    private void updateActionCollectionNameBeforeMerge(
            List<ActionCollection> importedNewActionCollectionList,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        Set<String> refactoringNameSet =
                mappedImportableResourcesDTO.getRefactoringNameReference().keySet();

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
            mappedImportableResourcesDTO
                    .getRefactoringNameReference()
                    .put(oldNameActionCollection, newNameActionCollection);
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
        existingActionCollection.setBranchName(importingMetaDTO.getBranchName());
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

    protected boolean existingArtifactContainsCollection(
            Map<String, ActionCollection> actionsCollectionsInCurrentArtifact, ActionCollection actionCollection) {
        return actionCollection.getGitSyncId() != null
                && actionsCollectionsInCurrentArtifact.containsKey(actionCollection.getGitSyncId());
    }

    protected void populateDomainMappedReferences(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, ActionCollection actionCollection) {
        // Nothing needs to be copied into the action collection from mapped resources
    }

    protected Mono<List<ActionCollection>> getImportableEntities(ArtifactExchangeJson artifactExchangeJson) {
        List<ActionCollection> list = CollectionUtils.isEmpty(artifactExchangeJson.getActionCollectionList())
                ? new ArrayList<>()
                : artifactExchangeJson.getActionCollectionList();

        return Mono.just(list);
    }
}
