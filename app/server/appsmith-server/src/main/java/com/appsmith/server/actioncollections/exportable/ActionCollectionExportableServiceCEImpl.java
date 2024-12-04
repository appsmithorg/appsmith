package com.appsmith.server.actioncollections.exportable;

import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.appsmith.external.git.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;

@RequiredArgsConstructor
public class ActionCollectionExportableServiceCEImpl implements ExportableServiceCE<ActionCollection> {

    private final ActionPermission actionPermission;
    protected final ArtifactBasedExportableService<ActionCollection, Application> applicationExportableService;

    @Override
    public ArtifactBasedExportableService<ActionCollection, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        return applicationExportableService;
    }

    // Requires contextIdToNameMap, pluginMap.
    // Updates collectionId to name map in exportable resources. Also, directly updates required collection information
    // in application json
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        ArtifactBasedExportableService<ActionCollection, ?> artifactBasedExportableService =
                getArtifactBasedExportableService(exportingMetaDTO);

        AclPermission exportPermission = actionPermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration());
        Flux<ActionCollection> actionCollectionFlux = artifactBasedExportableService.findByContextIdsForExport(
                exportingMetaDTO.getUnpublishedContextIds(), exportPermission);
        return actionCollectionFlux
                .collectList()
                .map(actionCollectionList -> {
                    mapNameToIdForExportableEntities(
                            exportingMetaDTO, mappedExportableResourcesDTO, actionCollectionList);
                    return getExportableActionCollections(actionCollectionList);
                })
                .map(actionCollections -> {
                    // This object won't have the list of actions, but we don't care about that today
                    // Because the actions will have a reference to the collection

                    Set<String> updatedActionCollectionSet = new HashSet<>();
                    Set<String> updatedIdentifiers = new HashSet<>();
                    actionCollections.forEach(actionCollection -> {
                        ActionCollectionDTO publishedActionCollectionDTO = actionCollection.getPublishedCollection();
                        ActionCollectionDTO unpublishedActionCollectionDTO =
                                actionCollection.getUnpublishedCollection();
                        ActionCollectionDTO actionCollectionDTO = unpublishedActionCollectionDTO != null
                                ? unpublishedActionCollectionDTO
                                : publishedActionCollectionDTO;

                        //  we've replaced page id with page name in previous step
                        String contextNameAtIdReference =
                                artifactBasedExportableService.getContextNameAtIdReference(actionCollectionDTO);
                        String contextGitSyncId = mappedExportableResourcesDTO
                                .getContextNameToGitSyncIdMap()
                                .get(contextNameAtIdReference);
                        boolean isContextUpdated = artifactExchangeJson
                                .getModifiedResources()
                                .isResourceUpdatedNew(GitResourceType.CONTEXT_CONFIG, contextGitSyncId);
                        String actionCollectionName =
                                actionCollectionDTO.getUserExecutableName() + NAME_SEPARATOR + contextNameAtIdReference;
                        Instant actionCollectionUpdatedAt = actionCollection.getUpdatedAt();
                        boolean isActionCollectionUpdated = exportingMetaDTO.isClientSchemaMigrated()
                                || exportingMetaDTO.isServerSchemaMigrated()
                                || isContextUpdated
                                || exportingMetaDTO.getArtifactLastCommittedAt() == null
                                || actionCollectionUpdatedAt == null
                                || exportingMetaDTO.getArtifactLastCommittedAt().isBefore(actionCollectionUpdatedAt);
                        if (isActionCollectionUpdated) {
                            updatedActionCollectionSet.add(actionCollectionName);
                            updatedIdentifiers.add(actionCollection.getGitSyncId());
                        }
                        actionCollection.sanitiseToExportDBObject();
                    });

                    artifactExchangeJson.setActionCollectionList(actionCollections);
                    artifactExchangeJson
                            .getModifiedResources()
                            .putResource(FieldName.ACTION_COLLECTION_LIST, updatedActionCollectionSet);
                    artifactExchangeJson
                            .getModifiedResources()
                            .getModifiedResourceIdentifiers()
                            .get(GitResourceType.JSOBJECT_CONFIG)
                            .addAll(updatedIdentifiers);

                    return actionCollections;
                })
                .then();
    }

    protected List<ActionCollection> getExportableActionCollections(List<ActionCollection> actionCollectionList) {
        return actionCollectionList;
    }

    @Override
    public Set<String> mapNameToIdForExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            List<ActionCollection> actionCollectionList) {

        ArtifactBasedExportableService<ActionCollection, ?> artifactBasedExportableService =
                this.getArtifactBasedExportableService(exportingMetaDTO);

        actionCollectionList.forEach(actionCollection -> {
            // Remove references to ids since the serialized version does not have this information
            actionCollection.setWorkspaceId(null);
            actionCollection.setPolicies(null);
            // Set unique ids for actionCollection, also populate collectionIdToName map which will
            // be used to replace collectionIds in action
            if (actionCollection.getUnpublishedCollection() != null) {
                artifactBasedExportableService.mapExportableReferences(
                        mappedExportableResourcesDTO, actionCollection, EDIT);
            }
            if (actionCollection.getPublishedCollection() != null) {
                artifactBasedExportableService.mapExportableReferences(
                        mappedExportableResourcesDTO, actionCollection, VIEW);
            }
        });
        return new HashSet<>();
    }
}
