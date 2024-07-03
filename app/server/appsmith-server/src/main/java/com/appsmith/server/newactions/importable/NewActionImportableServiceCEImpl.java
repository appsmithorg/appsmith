package com.appsmith.server.newactions.importable;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportActionCollectionResultDTO;
import com.appsmith.server.dtos.ImportActionResultDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.helpers.ImportExportUtils.sanitizeDatasourceInActionDTO;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewActionImportableServiceCEImpl implements ImportableServiceCE<NewAction> {

    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    protected final ArtifactBasedImportableService<NewAction, Application> applicationImportableService;

    @Override
    public ArtifactBasedImportableService<NewAction, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        return applicationImportableService;
    }

    // Requires contextNameMap, contextNameToOldNameMap, pluginMap and datasourceNameToIdMap, to be present in
    // importable resources.
    // Updates actionResultDTO in importable resources.
    // Also, directly updates required information in DB
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        Mono<List<NewAction>> importedNewActionListMono = this.getImportableEntities(artifactExchangeJson);

        return importedNewActionListMono
                .flatMap(importedNewActionList -> createImportNewActionsMono(
                        importedNewActionList, importableArtifactMono, importingMetaDTO, mappedImportableResourcesDTO))
                .flatMap(importActionResultDTO -> {
                    log.info("Actions imported. result: {}", importActionResultDTO.getGist());
                    // Updating the existing artifact for git-sync
                    // During partial import/appending to the existing artifact keep the resources
                    // attached to the artifact:
                    // Delete the invalid resources (which are not the part of artifactJsonDTO) in
                    // the git flow only
                    if (StringUtils.hasText(importingMetaDTO.getArtifactId())
                            && !TRUE.equals(importingMetaDTO.getAppendToArtifact())
                            && CollectionUtils.isNotEmpty(importActionResultDTO.getExistingActions())) {
                        // Remove unwanted actions
                        Set<String> invalidActionIds = new HashSet<>();
                        if (Boolean.FALSE.equals(importingMetaDTO.getIsPartialImport())) {
                            for (NewAction action : importActionResultDTO.getExistingActions()) {
                                if (!importActionResultDTO
                                        .getImportedActionIds()
                                        .contains(action.getId())) {
                                    invalidActionIds.add(action.getId());
                                }
                            }
                        }
                        log.info("Deleting {} actions which are no more used", invalidActionIds.size());
                        return Flux.fromIterable(invalidActionIds)
                                .flatMap(actionId -> newActionService
                                        .deleteUnpublishedAction(actionId, null)
                                        // return an empty action so that the filter can remove it from the list
                                        .onErrorResume(throwable -> {
                                            log.debug("Failed to delete action with id {} during import", actionId);
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        }))
                                .then()
                                .thenReturn(importActionResultDTO);
                    }
                    return Mono.just(importActionResultDTO);
                })
                .onErrorResume(throwable -> {
                    log.error("Error while importing actions and deleting unused ones", throwable);
                    return Mono.error(throwable);
                })
                .then();
    }

    protected Mono<List<NewAction>> getImportableEntities(ArtifactExchangeJson artifactExchangeJson) {
        List<NewAction> list = CollectionUtils.isEmpty(artifactExchangeJson.getActionList())
                ? new ArrayList<>()
                : artifactExchangeJson.getActionList();

        return Mono.just(list);
    }

    @Override
    public Mono<Void> updateImportedEntities(
            Artifact importableArtifact,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ImportActionResultDTO importActionResultDTO = mappedImportableResourcesDTO.getActionResultDTO();
        ImportActionCollectionResultDTO importActionCollectionResultDTO =
                mappedImportableResourcesDTO.getActionCollectionResultDTO();

        List<String> savedCollectionIds = importActionCollectionResultDTO.getSavedActionCollectionIds();
        log.info(
                "Action collections imported. artifactId {}, result: {}",
                importableArtifact.getId(),
                importActionCollectionResultDTO.getGist());
        return newActionService
                .updateActionsWithImportedCollectionIds(importActionCollectionResultDTO, importActionResultDTO)
                .flatMap(actionAndCollectionMapsDTO -> {
                    log.info("Updated actions with imported collection ids. artifactId {}", importableArtifact.getId());
                    // Updating the existing importableArtifact for git-sync
                    // During partial import/appending to the existing importableArtifact keep the resources
                    // attached to the importableArtifact:
                    // Delete the invalid resources (which are not the part of artifactJsonDTO) in
                    // the git flow only
                    if (StringUtils.hasText(importingMetaDTO.getArtifactId())
                            && !TRUE.equals(importingMetaDTO.getAppendToArtifact())
                            && Boolean.FALSE.equals(importingMetaDTO.getIsPartialImport())) {
                        // Remove unwanted action collections
                        Set<String> invalidCollectionIds = new HashSet<>();
                        for (ActionCollection collection :
                                importActionCollectionResultDTO.getExistingActionCollections()) {
                            if (!savedCollectionIds.contains(collection.getId())) {
                                invalidCollectionIds.add(collection.getId());
                            }
                        }
                        log.info("Deleting {} action collections which are no more used", invalidCollectionIds.size());
                        return Flux.fromIterable(invalidCollectionIds)
                                .flatMap(collectionId -> actionCollectionService
                                        .deleteWithoutPermissionUnpublishedActionCollection(collectionId)
                                        // return an empty collection so that the filter can remove it from
                                        // the list
                                        .onErrorResume(throwable -> {
                                            log.debug(
                                                    "Failed to delete collection with id {} during import",
                                                    collectionId);
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        }))
                                .then();
                    }

                    mappedImportableResourcesDTO.setActionAndCollectionMapsDTO(actionAndCollectionMapsDTO);

                    return Mono.empty().then();
                })
                .onErrorResume(error -> {
                    log.error("Error while updating collection id to actions", error);
                    return Mono.error(error);
                });
    }

    /**
     * Method to
     * - save imported actions with updated policies
     * - update default resource ids along with branch-name if the artifact is connected to git
     * - update the map of imported collectionIds to the actionIds in saved in DB
     *
     * @param importedNewActions     action list extracted from the imported JSON file
     * @param importableArtifactMono imported and saved artifact in DB
     * @return A DTO class with several information
     */
    private Mono<ImportActionResultDTO> createImportNewActionsMono(
            List<NewAction> importedNewActions,
            Mono<? extends Artifact> importableArtifactMono,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ArtifactBasedImportableService<NewAction, ?> artifactBasedImportableService =
                getArtifactBasedImportableService(importingMetaDTO);

        Mono<List<NewAction>> importedNewActionMono = Mono.justOrEmpty(importedNewActions);

        if (TRUE.equals(importingMetaDTO.getAppendToArtifact())) {
            importedNewActionMono = importedNewActionMono.map(importedNewActionList -> {
                List<String> importedContextNames =
                        artifactBasedImportableService.getImportedContextNames(mappedImportableResourcesDTO);
                Map<String, String> newToOldNameMap = mappedImportableResourcesDTO.getContextNewNameToOldName();

                for (String newContextName : importedContextNames) {
                    String oldContextName = newToOldNameMap.get(newContextName);

                    if (!newContextName.equals(oldContextName)) {
                        artifactBasedImportableService.renameContextInImportableResources(
                                importedNewActionList, oldContextName, newContextName);
                    }
                }
                return importedNewActionList;
            });
        }

        return Mono.zip(importableArtifactMono, importedNewActionMono)
                .flatMap(objects -> importNewActions(
                        objects.getT1(), objects.getT2(), importingMetaDTO, mappedImportableResourcesDTO))
                .onErrorResume(e -> {
                    log.error("Error importing actions", e);
                    return Mono.error(e);
                })
                .elapsed()
                .map(tuple -> {
                    log.debug(
                            "time to import {} actions: {} ms",
                            tuple.getT2().getImportedActionIds().size(),
                            tuple.getT1());
                    return tuple.getT2();
                });
    }

    @NotNull private Mono<ImportActionResultDTO> importNewActions(
            Artifact importableArtifact,
            List<NewAction> importedNewActionList,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ArtifactBasedImportableService<NewAction, ?> artifactBasedImportableService =
                getArtifactBasedImportableService(importingMetaDTO);

        /* Mono.just(importableArtifact) is created to avoid the eagerly fetching of existing actions
         * during the pipeline construction. It should be fetched only when the pipeline is subscribed/executed.
         */
        return Mono.just(importableArtifact).flatMap(artifact -> {
            ImportActionResultDTO importActionResultDTO = new ImportActionResultDTO();
            mappedImportableResourcesDTO.setActionResultDTO(importActionResultDTO);

            Mono<Map<String, NewAction>> actionsInCurrentArtifactMono = artifactBasedImportableService
                    .getExistingResourcesInCurrentArtifactFlux(artifact)
                    .filter(collection -> collection.getGitSyncId() != null)
                    .collectMap(NewAction::getGitSyncId);

            // find existing actions in all the branches of this artifact and put them in a map
            Mono<Map<String, NewAction>> actionsInOtherBranchesMono;
            if (artifact.getGitArtifactMetadata() != null) {
                final String defaultArtifactId =
                        artifact.getGitArtifactMetadata().getDefaultArtifactId();
                actionsInOtherBranchesMono = artifactBasedImportableService
                        .getExistingResourcesInOtherBranchesFlux(defaultArtifactId, artifact.getId())
                        .filter(newAction -> newAction.getGitSyncId() != null)
                        .collectMap(NewAction::getGitSyncId);
            } else {
                actionsInOtherBranchesMono = Mono.just(Collections.emptyMap());
            }

            // update the action name in the json to avoid duplicate names for the partial import
            // It is context level action and hence the action name should be unique
            if (TRUE.equals(importingMetaDTO.getIsPartialImport())
                    && mappedImportableResourcesDTO.getRefactoringNameReference() != null) {
                updateActionNameBeforeMerge(importedNewActionList, mappedImportableResourcesDTO);
            }

            return Mono.zip(actionsInCurrentArtifactMono, actionsInOtherBranchesMono)
                    .flatMap(objects -> {
                        Map<String, NewAction> actionsInCurrentArtifact = objects.getT1();
                        Map<String, NewAction> actionsInBranches = objects.getT2();

                        // set the existing actions in the result DTO,
                        // this will be required in next phases when we'll delete the outdated actions
                        importActionResultDTO.setExistingActions(actionsInCurrentArtifact.values());

                        List<NewAction> newNewActionList = new ArrayList<>();
                        List<NewAction> existingNewActionList = new ArrayList<>();

                        for (NewAction newAction : importedNewActionList) {
                            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                            if (unpublishedAction == null
                                    || !StringUtils.hasLength(unpublishedAction.calculateContextId())) {
                                continue; // invalid action, skip it
                            }

                            NewAction branchedNewAction = null;

                            if (actionsInBranches.containsKey(newAction.getGitSyncId())) {
                                branchedNewAction =
                                        artifactBasedImportableService.getExistingEntityInOtherBranchForImportedEntity(
                                                mappedImportableResourcesDTO, actionsInBranches, newAction);
                            }

                            Context defaultContext = populateIdReferencesAndReturnDefaultContext(
                                    importingMetaDTO,
                                    mappedImportableResourcesDTO,
                                    artifact,
                                    branchedNewAction,
                                    newAction);

                            // Check if the action has datasource present
                            Datasource datasource =
                                    newAction.getUnpublishedAction().getDatasource();
                            if (datasource != null && datasource.getPluginId() == null) {
                                // Since the datasource are not yet saved to db, if we don't update the action with
                                // correct datasource,
                                // the action ave will fail due to validation
                                if (!StringUtils.isEmpty(newAction
                                        .getUnpublishedAction()
                                        .getDatasource()
                                        .getId())) {
                                    final String datasourceId = newAction
                                            .getUnpublishedAction()
                                            .getDatasource()
                                            .getId();
                                    datasource =
                                            mappedImportableResourcesDTO.getDatasourceDryRunQueries().values().stream()
                                                    .flatMap(List::stream)
                                                    .filter(ds -> ds.getId().equals(datasourceId))
                                                    .findFirst()
                                                    .orElse(datasource);
                                    datasource.setIsAutoGenerated(false);
                                }

                                newAction.getUnpublishedAction().setDatasource(datasource);
                            }

                            // Check if the action has gitSyncId and if it's already in DB
                            if (existingArtifactContainsAction(actionsInCurrentArtifact, newAction)) {

                                // Since the resource is already present in DB, just update resource
                                NewAction existingAction =
                                        artifactBasedImportableService
                                                .getExistingEntityInCurrentBranchForImportedEntity(
                                                        mappedImportableResourcesDTO,
                                                        actionsInCurrentArtifact,
                                                        newAction);

                                updateExistingAction(
                                        existingAction,
                                        newAction,
                                        importingMetaDTO.getBranchName(),
                                        importingMetaDTO.getPermissionProvider());

                                // Add it to actions list that'll be updated in bulk
                                existingNewActionList.add(existingAction);
                                importActionResultDTO.getImportedActionIds().add(existingAction.getId());
                                putActionIdInMap(existingAction, importActionResultDTO);
                            } else {

                                artifactBasedImportableService.createNewResource(
                                        importingMetaDTO, newAction, defaultContext);

                                populateDomainMappedReferences(mappedImportableResourcesDTO, newAction);

                                // Add it to actions list that'll be inserted or updated in bulk
                                newNewActionList.add(newAction);

                                importActionResultDTO.getImportedActionIds().add(newAction.getId());
                                putActionIdInMap(newAction, importActionResultDTO);
                            }
                        }

                        log.info(
                                "Saving actions in bulk. New: {}, Updated: {}",
                                newNewActionList.size(),
                                existingNewActionList.size());

                        // Save all the new actions in bulk
                        return Mono.when(
                                        newActionService.bulkValidateAndInsertActionInRepository(newNewActionList),
                                        newActionService.bulkValidateAndUpdateActionInRepository(existingNewActionList))
                                .thenReturn(importActionResultDTO);
                    });
        });
    }

    private Context populateIdReferencesAndReturnDefaultContext(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Artifact importableArtifact,
            NewAction branchedNewAction,
            NewAction newAction) {
        ArtifactBasedImportableService<NewAction, ?> artifactBasedImportableService =
                this.getArtifactBasedImportableService(importingMetaDTO);

        String workspaceId = importingMetaDTO.getWorkspaceId();
        ActionDTO unpublishedAction = newAction.getUnpublishedAction();
        ActionDTO publishedAction = newAction.getPublishedAction();
        Context parentContext = null;

        // If contextId is missing in the actionDTO create a fallback contextId
        final String fallbackDefaultContextId = unpublishedAction.calculateContextId();

        if (unpublishedAction.getValidName() != null) {
            unpublishedAction.setId(newAction.getId());
            parentContext = artifactBasedImportableService.updateContextInResource(
                    unpublishedAction, mappedImportableResourcesDTO.getContextMap(), fallbackDefaultContextId);

            mappedImportableResourcesDTO
                    .getActionResultDTO()
                    .getActionIdMap()
                    .put(unpublishedAction.getValidName() + parentContext.getId(), unpublishedAction.getId());
            sanitizeDatasourceInActionDTO(
                    unpublishedAction,
                    mappedImportableResourcesDTO.getDatasourceNameToIdMap(),
                    mappedImportableResourcesDTO.getPluginMap(),
                    workspaceId,
                    false);
        }

        if (publishedAction != null && publishedAction.getValidName() != null) {
            publishedAction.setId(newAction.getId());
            Context publishedActionContext = artifactBasedImportableService.updateContextInResource(
                    publishedAction, mappedImportableResourcesDTO.getContextMap(), fallbackDefaultContextId);

            if (publishedActionContext != null) {
                mappedImportableResourcesDTO
                        .getActionResultDTO()
                        .getActionIdMap()
                        .put(publishedAction.getValidName() + publishedActionContext.getId(), publishedAction.getId());
            }

            parentContext = parentContext == null ? publishedActionContext : parentContext;
            sanitizeDatasourceInActionDTO(
                    publishedAction,
                    mappedImportableResourcesDTO.getDatasourceNameToIdMap(),
                    mappedImportableResourcesDTO.getPluginMap(),
                    workspaceId,
                    false);
        }

        newAction.makePristine();
        newAction.setWorkspaceId(workspaceId);

        newAction.setPluginId(mappedImportableResourcesDTO.getPluginMap().get(newAction.getPluginId()));

        artifactBasedImportableService.populateDefaultResources(
                importingMetaDTO, mappedImportableResourcesDTO, importableArtifact, branchedNewAction, newAction);

        return parentContext;
    }

    private void updateActionNameBeforeMerge(
            List<NewAction> importedNewActionList, MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        Set<String> refactoringNames =
                mappedImportableResourcesDTO.getRefactoringNameReference().keySet();

        for (NewAction newAction : importedNewActionList) {
            String oldNameAction = newAction.getUnpublishedAction().getName(),
                    newNameAction = newAction.getUnpublishedAction().getName();
            int i = 1;
            while (refactoringNames.contains(newNameAction)) {
                newNameAction = oldNameAction + i++;
            }
            String oldId = newAction.getId().split("_")[1];
            newAction.setId(newNameAction + "_" + oldId);
            newAction.getUnpublishedAction().setName(newNameAction);
            newAction.getUnpublishedAction().setFullyQualifiedName(newNameAction);
            if (newAction.getPublishedAction() != null) {
                newAction.getPublishedAction().setName(newNameAction);
                newAction.getPublishedAction().setFullyQualifiedName(newNameAction);
            }
            mappedImportableResourcesDTO.getRefactoringNameReference().put(oldNameAction, newNameAction);
        }
    }

    protected boolean existingArtifactContainsAction(
            Map<String, NewAction> actionsInCurrentArtifact, NewAction newAction) {
        return newAction.getGitSyncId() != null && actionsInCurrentArtifact.containsKey(newAction.getGitSyncId());
    }

    protected void populateDomainMappedReferences(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, NewAction newAction) {
        // Nothing needs to be copied into the action from mapped resources
    }

    private void updateExistingAction(
            NewAction existingAction,
            NewAction actionToImport,
            String branchName,
            ImportArtifactPermissionProvider permissionProvider) {
        // Since the resource is already present in DB, just update resource
        if (!permissionProvider.hasEditPermission(existingAction)) {
            log.error("User does not have permission to edit action with id: {}", existingAction.getId());
            throw new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION, existingAction.getId());
        }
        Set<Policy> existingPolicy = existingAction.getPolicies();

        updateImportableActionFromExistingAction(existingAction, actionToImport);

        copyNestedNonNullProperties(actionToImport, existingAction);
        // Update branchName
        existingAction.getDefaultResources().setBranchName(branchName);
        // Recover the deleted state present in DB from imported action
        existingAction
                .getUnpublishedAction()
                .setDeletedAt(actionToImport.getUnpublishedAction().getDeletedAt());
        existingAction.setDeletedAt(actionToImport.getDeletedAt());
        existingAction.setPolicies(existingPolicy);
    }

    protected void updateImportableActionFromExistingAction(NewAction existingAction, NewAction actionToImport) {
        // Nothing to update from the existing action
    }

    private void putActionIdInMap(NewAction newAction, ImportActionResultDTO importActionResultDTO) {
        // Populate actionIdsMap to associate the appropriate actions to run on context load
        String defaultResourcesActionId = newAction.getDefaultResources().getActionId();

        if (defaultResourcesActionId == null) {
            defaultResourcesActionId = newAction.getId();
            newAction.getDefaultResources().setActionId(newAction.getId());
        }

        if (newAction.getUnpublishedAction() != null) {
            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
            importActionResultDTO
                    .getActionIdMap()
                    .put(
                            importActionResultDTO
                                    .getActionIdMap()
                                    .get(unpublishedAction.getValidName() + unpublishedAction.calculateContextId()),
                            newAction.getId());

            if (unpublishedAction.getCollectionId() != null) {
                importActionResultDTO
                        .getUnpublishedCollectionIdToActionIdsMap()
                        .putIfAbsent(unpublishedAction.getCollectionId(), new HashMap<>());
                final Map<String, String> actionIds = importActionResultDTO
                        .getUnpublishedCollectionIdToActionIdsMap()
                        .get(unpublishedAction.getCollectionId());

                actionIds.put(defaultResourcesActionId, newAction.getId());
            }
        }
        if (newAction.getPublishedAction() != null) {
            ActionDTO publishedAction = newAction.getPublishedAction();
            importActionResultDTO
                    .getActionIdMap()
                    .put(
                            importActionResultDTO
                                    .getActionIdMap()
                                    .get(publishedAction.getValidName() + publishedAction.calculateContextId()),
                            newAction.getId());

            if (publishedAction.getCollectionId() != null) {
                importActionResultDTO
                        .getPublishedCollectionIdToActionIdsMap()
                        .putIfAbsent(publishedAction.getCollectionId(), new HashMap<>());
                final Map<String, String> actionIds = importActionResultDTO
                        .getPublishedCollectionIdToActionIdsMap()
                        .get(publishedAction.getCollectionId());
                actionIds.put(defaultResourcesActionId, newAction.getId());
            }
        }
    }
}
