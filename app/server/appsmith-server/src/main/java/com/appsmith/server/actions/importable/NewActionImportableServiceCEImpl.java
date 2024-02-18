package com.appsmith.server.actions.importable;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.ImportableArtifact;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.jetbrains.annotations.NotNull;
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
@RequiredArgsConstructor
public class NewActionImportableServiceCEImpl implements ImportableServiceCE<Action> {

    private final ActionService actionService;
    private final ActionCollectionService actionCollectionService;
    protected final ArtifactBasedImportableService<Action, Application> applicationImportableService;

    @Override
    public ArtifactBasedImportableService<Action, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        return applicationImportableService;
    }

    // Requires contextNameMap, contextNameToOldNameMap, pluginMap and datasourceNameToIdMap, to be present in
    // importable
    // resources.
    // Updates actionResultDTO in importable resources.
    // Also, directly updates required information in DB
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        List<Action> importedActionList = CollectionUtils.isEmpty(artifactExchangeJson.getActionList())
                ? new ArrayList<>()
                : artifactExchangeJson.getActionList();

        return createImportNewActionsMono(
                        importedActionList, importableArtifactMono, importingMetaDTO, mappedImportableResourcesDTO)
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
                            for (Action action : importActionResultDTO.getExistingActions()) {
                                if (!importActionResultDTO
                                        .getImportedActionIds()
                                        .contains(action.getId())) {
                                    invalidActionIds.add(action.getId());
                                }
                            }
                        }
                        log.info("Deleting {} actions which are no more used", invalidActionIds.size());
                        return Flux.fromIterable(invalidActionIds)
                                .flatMap(actionId -> actionService
                                        .deleteUnpublishedAction(actionId)
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

    @Override
    public Mono<Void> updateImportedEntities(
            ImportableArtifact importableArtifact,
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
        return actionService
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
     * @param importedActions     action list extracted from the imported JSON file
     * @param importableArtifactMono imported and saved artifact in DB
     * @return A DTO class with several information
     */
    private Mono<ImportActionResultDTO> createImportNewActionsMono(
            List<Action> importedActions,
            Mono<? extends ImportableArtifact> importableArtifactMono,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ArtifactBasedImportableService<Action, ?> artifactBasedExportableService =
                getArtifactBasedImportableService(importingMetaDTO);

        Mono<List<Action>> importedNewActionMono = Mono.justOrEmpty(importedActions);

        if (TRUE.equals(importingMetaDTO.getAppendToArtifact())) {
            importedNewActionMono = importedNewActionMono.map(importedNewActionList -> {
                List<String> importedContextNames =
                        artifactBasedExportableService.getImportedContextNames(mappedImportableResourcesDTO);
                Map<String, String> newToOldNameMap = mappedImportableResourcesDTO.getContextNewNameToOldName();

                for (String newContextName : importedContextNames) {
                    String oldContextName = newToOldNameMap.get(newContextName);

                    if (!newContextName.equals(oldContextName)) {
                        artifactBasedExportableService.renameContextInImportableResources(
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
            ImportableArtifact importableArtifact,
            List<Action> importedActionList,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {

        ArtifactBasedImportableService<Action, ?> artifactBasedExportableService =
                getArtifactBasedImportableService(importingMetaDTO);

        /* Mono.just(importableArtifact) is created to avoid the eagerly fetching of existing actions
         * during the pipeline construction. It should be fetched only when the pipeline is subscribed/executed.
         */
        return Mono.just(importableArtifact).flatMap(artifact -> {
            ImportActionResultDTO importActionResultDTO = new ImportActionResultDTO();
            mappedImportableResourcesDTO.setActionResultDTO(importActionResultDTO);

            Mono<Map<String, Action>> actionsInCurrentArtifactMono = artifactBasedExportableService
                    .getExistingResourcesInCurrentArtifactFlux(artifact)
                    .filter(collection -> collection.getGitSyncId() != null)
                    .collectMap(Action::getGitSyncId);

            // find existing actions in all the branches of this artifact and put them in a map
            Mono<Map<String, Action>> actionsInOtherBranchesMono;
            if (artifact.getGitArtifactMetadata() != null) {
                final String defaultArtifactId =
                        artifact.getGitArtifactMetadata().getDefaultArtifactId();
                actionsInOtherBranchesMono = artifactBasedExportableService
                        .getExistingResourcesInOtherBranchesFlux(defaultArtifactId, artifact.getId())
                        .filter(newAction -> newAction.getGitSyncId() != null)
                        .collectMap(Action::getGitSyncId);
            } else {
                actionsInOtherBranchesMono = Mono.just(Collections.emptyMap());
            }

            // update the action name in the json to avoid duplicate names for the partial import
            // It is context level action and hence the action name should be unique
            if (TRUE.equals(importingMetaDTO.getIsPartialImport())
                    && mappedImportableResourcesDTO.getRefactoringNameReference() != null) {
                updateActionNameBeforeMerge(
                        importedActionList, mappedImportableResourcesDTO.getRefactoringNameReference());
            }

            return Mono.zip(actionsInCurrentArtifactMono, actionsInOtherBranchesMono)
                    .flatMap(objects -> {
                        Map<String, Action> actionsInCurrentArtifact = objects.getT1();
                        Map<String, Action> actionsInBranches = objects.getT2();

                        // set the existing actions in the result DTO,
                        // this will be required in next phases when we'll delete the outdated actions
                        importActionResultDTO.setExistingActions(actionsInCurrentArtifact.values());

                        List<Action> newActionList = new ArrayList<>();
                        List<Action> existingActionList = new ArrayList<>();

                        for (Action action : importedActionList) {
                            ActionDTO unpublishedAction = action.getUnpublishedAction();
                            if (unpublishedAction == null
                                    || !StringUtils.hasLength(unpublishedAction.calculateContextId())) {
                                continue; // invalid action, skip it
                            }

                            Action branchedAction = null;

                            if (actionsInBranches.containsKey(action.getGitSyncId())) {
                                branchedAction = getExistingActionInCurrentBranchForImportedAction(
                                        mappedImportableResourcesDTO, actionsInBranches, action);
                            }

                            Context defaultContext = populateIdReferencesAndReturnDefaultContext(
                                    importingMetaDTO, mappedImportableResourcesDTO, artifact, branchedAction, action);

                            // Check if the action has gitSyncId and if it's already in DB
                            if (existingArtifactContainsAction(actionsInCurrentArtifact, action)) {

                                // Since the resource is already present in DB, just update resource
                                Action existingAction = getExistingActionInCurrentBranchForImportedAction(
                                        mappedImportableResourcesDTO, actionsInCurrentArtifact, action);

                                updateExistingAction(
                                        existingAction,
                                        action,
                                        importingMetaDTO.getBranchName(),
                                        importingMetaDTO.getPermissionProvider());

                                // Add it to actions list that'll be updated in bulk
                                existingActionList.add(existingAction);
                                importActionResultDTO.getImportedActionIds().add(existingAction.getId());
                                putActionIdInMap(existingAction, importActionResultDTO);
                            } else {

                                artifactBasedExportableService.createNewResource(
                                        importingMetaDTO, action, defaultContext);

                                populateDomainMappedReferences(mappedImportableResourcesDTO, action);

                                // Add it to actions list that'll be inserted or updated in bulk
                                newActionList.add(action);

                                importActionResultDTO.getImportedActionIds().add(action.getId());
                                putActionIdInMap(action, importActionResultDTO);
                            }
                        }

                        log.info(
                                "Saving actions in bulk. New: {}, Updated: {}",
                                newActionList.size(),
                                existingActionList.size());

                        // Save all the new actions in bulk
                        return Mono.when(
                                        actionService.bulkValidateAndInsertActionInRepository(newActionList),
                                        actionService.bulkValidateAndUpdateActionInRepository(existingActionList))
                                .thenReturn(importActionResultDTO);
                    });
        });
    }

    private Context populateIdReferencesAndReturnDefaultContext(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportableArtifact importableArtifact,
            Action branchedAction,
            Action action) {
        ArtifactBasedImportableService<Action, ?> artifactBasedExportableService =
                this.getArtifactBasedImportableService(importingMetaDTO);

        String workspaceId = importingMetaDTO.getWorkspaceId();
        ActionDTO unpublishedAction = action.getUnpublishedAction();
        ActionDTO publishedAction = action.getPublishedAction();
        Context parentContext = null;

        // If contextId is missing in the actionDTO create a fallback contextId
        final String fallbackDefaultContextId = unpublishedAction.calculateContextId();

        if (unpublishedAction.getValidName() != null) {
            unpublishedAction.setId(action.getId());
            parentContext = artifactBasedExportableService.updateContextInResource(
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
            publishedAction.setId(action.getId());
            Context publishedActionContext = artifactBasedExportableService.updateContextInResource(
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

        action.makePristine();
        action.setWorkspaceId(workspaceId);

        action.setPluginId(mappedImportableResourcesDTO.getPluginMap().get(action.getPluginId()));

        artifactBasedExportableService.populateDefaultResources(
                importingMetaDTO, mappedImportableResourcesDTO, importableArtifact, branchedAction, action);

        return parentContext;
    }

    private void updateActionNameBeforeMerge(List<Action> importedActionList, Set<String> refactoringNames) {

        for (Action action : importedActionList) {
            String oldNameAction = action.getUnpublishedAction().getName(),
                    newNameAction = action.getUnpublishedAction().getName();
            int i = 1;
            while (refactoringNames.contains(newNameAction)) {
                newNameAction = oldNameAction + i++;
            }
            String oldId = action.getId().split("_")[1];
            action.setId(newNameAction + "_" + oldId);
            action.getUnpublishedAction().setName(newNameAction);
            action.getUnpublishedAction().setFullyQualifiedName(newNameAction);
            if (action.getPublishedAction() != null) {
                action.getPublishedAction().setName(newNameAction);
                action.getPublishedAction().setFullyQualifiedName(newNameAction);
            }
        }
    }

    protected Action getExistingActionInCurrentBranchForImportedAction(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, Action> actionsInCurrentArtifact,
            Action action) {
        return actionsInCurrentArtifact.get(action.getGitSyncId());
    }

    protected boolean existingArtifactContainsAction(Map<String, Action> actionsInCurrentArtifact, Action action) {
        return action.getGitSyncId() != null && actionsInCurrentArtifact.containsKey(action.getGitSyncId());
    }

    protected void populateDomainMappedReferences(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, Action action) {
        // Nothing needs to be copied into the action from mapped resources
    }

    private void updateExistingAction(
            Action existingAction,
            Action actionToImport,
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

    protected void updateImportableActionFromExistingAction(Action existingAction, Action actionToImport) {
        // Nothing to update from the existing action
    }

    private void putActionIdInMap(Action action, ImportActionResultDTO importActionResultDTO) {
        // Populate actionIdsMap to associate the appropriate actions to run on context load
        String defaultResourcesActionId = action.getDefaultResources().getActionId();

        if (defaultResourcesActionId == null) {
            defaultResourcesActionId = action.getId();
            action.getDefaultResources().setActionId(action.getId());
        }

        if (action.getUnpublishedAction() != null) {
            ActionDTO unpublishedAction = action.getUnpublishedAction();
            importActionResultDTO
                    .getActionIdMap()
                    .put(
                            importActionResultDTO
                                    .getActionIdMap()
                                    .get(unpublishedAction.getValidName() + unpublishedAction.calculateContextId()),
                            action.getId());

            if (unpublishedAction.getCollectionId() != null) {
                importActionResultDTO
                        .getUnpublishedCollectionIdToActionIdsMap()
                        .putIfAbsent(unpublishedAction.getCollectionId(), new HashMap<>());
                final Map<String, String> actionIds = importActionResultDTO
                        .getUnpublishedCollectionIdToActionIdsMap()
                        .get(unpublishedAction.getCollectionId());

                actionIds.put(defaultResourcesActionId, action.getId());
            }
        }
        if (action.getPublishedAction() != null) {
            ActionDTO publishedAction = action.getPublishedAction();
            importActionResultDTO
                    .getActionIdMap()
                    .put(
                            importActionResultDTO
                                    .getActionIdMap()
                                    .get(publishedAction.getValidName() + publishedAction.calculateContextId()),
                            action.getId());

            if (publishedAction.getCollectionId() != null) {
                importActionResultDTO
                        .getPublishedCollectionIdToActionIdsMap()
                        .putIfAbsent(publishedAction.getCollectionId(), new HashMap<>());
                final Map<String, String> actionIds = importActionResultDTO
                        .getPublishedCollectionIdToActionIdsMap()
                        .get(publishedAction.getCollectionId());
                actionIds.put(defaultResourcesActionId, action.getId());
            }
        }
    }
}
