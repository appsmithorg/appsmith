package com.appsmith.server.actioncollections.exports;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.solutions.ActionPermission;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;

public class ActionCollectionExportableServiceCEImpl implements ExportableServiceCE<ActionCollection> {

    private final ActionCollectionService actionCollectionService;
    private final ActionPermission actionPermission;

    public ActionCollectionExportableServiceCEImpl(
            ActionCollectionService actionCollectionService, ActionPermission actionPermission) {
        this.actionCollectionService = actionCollectionService;
        this.actionPermission = actionPermission;
    }

    // Requires pageIdToNameMap, pluginMap.
    // Updates collectionId to name map in exportable resources. Also directly updates required collection information
    // in application json
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {

        Optional<AclPermission> optionalPermission = Optional.ofNullable(actionPermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration()));
        Flux<ActionCollection> actionCollectionFlux =
                actionCollectionService.findByListOfPageIds(exportingMetaDTO.getUnpublishedPages(), optionalPermission);
        return actionCollectionFlux
                .collectList()
                .map(actionCollectionList -> {
                    mapNameToIdForExportableEntities(mappedExportableResourcesDTO, actionCollectionList);
                    return actionCollectionList;
                })
                .map(actionCollections -> {
                    // This object won't have the list of actions but we don't care about that today
                    // Because the actions will have a reference to the collection

                    Set<String> updatedActionCollectionSet = new HashSet<>();
                    actionCollections.forEach(actionCollection -> {
                        ActionCollectionDTO publishedActionCollectionDTO = actionCollection.getPublishedCollection();
                        ActionCollectionDTO unpublishedActionCollectionDTO =
                                actionCollection.getUnpublishedCollection();
                        ActionCollectionDTO actionCollectionDTO = unpublishedActionCollectionDTO != null
                                ? unpublishedActionCollectionDTO
                                : publishedActionCollectionDTO;

                        // TODO: check whether resource updated after last commit - move to a function
                        // we've replaced page id with page name in previous step
                        String pageName = actionCollectionDTO.getPageId();
                        boolean isPageUpdated = ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName);
                        String actionCollectionName = actionCollectionDTO != null
                                ? actionCollectionDTO.getName() + NAME_SEPARATOR + actionCollectionDTO.getPageId()
                                : null;
                        Instant actionCollectionUpdatedAt = actionCollection.getUpdatedAt();
                        boolean isActionCollectionUpdated = exportingMetaDTO.isClientSchemaMigrated()
                                || exportingMetaDTO.isServerSchemaMigrated()
                                || isPageUpdated
                                || exportingMetaDTO.getApplicationLastCommittedAt() == null
                                || actionCollectionUpdatedAt == null
                                || exportingMetaDTO
                                        .getApplicationLastCommittedAt()
                                        .isBefore(actionCollectionUpdatedAt);
                        if (isActionCollectionUpdated && actionCollectionName != null) {
                            updatedActionCollectionSet.add(actionCollectionName);
                        }
                        actionCollection.sanitiseToExportDBObject();
                    });

                    applicationJson.setActionCollectionList(actionCollections);
                    applicationJson
                            .getUpdatedResources()
                            .put(FieldName.ACTION_COLLECTION_LIST, updatedActionCollectionSet);

                    return actionCollections;
                })
                .then();
    }

    @Override
    public Set<String> mapNameToIdForExportableEntities(
            MappedExportableResourcesDTO mappedExportableResourcesDTO, List<ActionCollection> actionCollectionList) {
        actionCollectionList.forEach(actionCollection -> {
            // Remove references to ids since the serialized version does not have this information
            actionCollection.setWorkspaceId(null);
            actionCollection.setPolicies(null);
            actionCollection.setApplicationId(null);
            // Set unique ids for actionCollection, also populate collectionIdToName map which will
            // be used to replace collectionIds in action
            if (actionCollection.getUnpublishedCollection() != null) {
                ActionCollectionDTO actionCollectionDTO = actionCollection.getUnpublishedCollection();
                actionCollectionDTO.setPageId(
                        mappedExportableResourcesDTO.getPageIdToNameMap().get(actionCollectionDTO.getPageId() + EDIT));
                actionCollectionDTO.setPluginId(
                        mappedExportableResourcesDTO.getPluginMap().get(actionCollectionDTO.getPluginId()));

                final String updatedCollectionId =
                        actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
                mappedExportableResourcesDTO
                        .getCollectionIdToNameMap()
                        .put(actionCollection.getId(), updatedCollectionId);
                actionCollection.setId(updatedCollectionId);
            }
            if (actionCollection.getPublishedCollection() != null) {
                ActionCollectionDTO actionCollectionDTO = actionCollection.getPublishedCollection();
                actionCollectionDTO.setPageId(
                        mappedExportableResourcesDTO.getPageIdToNameMap().get(actionCollectionDTO.getPageId() + VIEW));
                actionCollectionDTO.setPluginId(
                        mappedExportableResourcesDTO.getPluginMap().get(actionCollectionDTO.getPluginId()));

                if (!mappedExportableResourcesDTO.getCollectionIdToNameMap().containsValue(actionCollection.getId())) {
                    final String updatedCollectionId =
                            actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
                    mappedExportableResourcesDTO
                            .getCollectionIdToNameMap()
                            .put(actionCollection.getId(), updatedCollectionId);
                    actionCollection.setId(updatedCollectionId);
                }
            }
        });
        return new HashSet<>();
    }
}
