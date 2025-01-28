package com.appsmith.server.newactions.exportable;

import com.appsmith.external.git.models.GitResourceType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.helpers.ImportExportUtils;
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
import static com.appsmith.server.helpers.ImportExportUtils.sanitizeDatasourceInActionDTO;

@RequiredArgsConstructor
public class NewActionExportableServiceCEImpl implements ExportableServiceCE<NewAction> {

    private final ActionPermission actionPermission;
    protected final ArtifactBasedExportableService<NewAction, Application> applicationExportableService;

    @Override
    public ArtifactBasedExportableService<NewAction, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        return applicationExportableService;
    }

    // Requires datasourceIdToNameMap, pageIdToNameMap, pluginMap, collectionIdToNameMap
    // Updates actionId to name map in exportable resources.
    // Also, directly updates required collection information in application json
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        ArtifactBasedExportableService<NewAction, ?> artifactBasedExportableService =
                getArtifactBasedExportableService(exportingMetaDTO);

        AclPermission exportPermission = actionPermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration());

        Flux<NewAction> actionFlux = artifactBasedExportableService.findByContextIdsForExport(
                exportingMetaDTO.getUnpublishedContextIds(), exportPermission);

        return actionFlux
                .collectList()
                .flatMap(newActionList -> {
                    Set<String> dbNamesUsedInActions = mapNameToIdForExportableEntities(
                            exportingMetaDTO, mappedExportableResourcesDTO, newActionList);
                    List<NewAction> exportableNewActions = getExportableNewActions(newActionList);
                    return Mono.zip(Mono.just(exportableNewActions), Mono.just(dbNamesUsedInActions));
                })
                .map(tuple -> {
                    List<NewAction> actionList = tuple.getT1();
                    Set<String> dbNamesUsedInActions = tuple.getT2();
                    Set<String> updatedActionSet = new HashSet<>();
                    Set<String> updatedIdentities = new HashSet<>();
                    actionList.forEach(newAction -> {
                        ActionDTO unpublishedActionDTO = newAction.getUnpublishedAction();
                        ActionDTO publishedActionDTO = newAction.getPublishedAction();
                        ActionDTO actionDTO = unpublishedActionDTO != null ? unpublishedActionDTO : publishedActionDTO;
                        String contextNameAtIdReference =
                                artifactBasedExportableService.getContextNameAtIdReference(actionDTO);
                        String newActionName = actionDTO != null
                                ? actionDTO.getUserExecutableName() + NAME_SEPARATOR + contextNameAtIdReference
                                : null;
                        // we've replaced the datasource id with datasource name in previous step
                        boolean isDatasourceUpdated = ImportExportUtils.isDatasourceUpdatedSinceLastCommit(
                                mappedExportableResourcesDTO.getDatasourceNameToUpdatedAtMap(),
                                actionDTO,
                                exportingMetaDTO.getArtifactLastCommittedAt());

                        String contextGitSyncId = mappedExportableResourcesDTO
                                .getContextNameToGitSyncIdMap()
                                .get(contextNameAtIdReference);
                        boolean isContextUpdated = artifactExchangeJson
                                .getModifiedResources()
                                .isResourceUpdatedNew(GitResourceType.CONTEXT_CONFIG, contextGitSyncId);
                        Instant newActionUpdatedAt = newAction.getUpdatedAt();
                        boolean isNewActionUpdated = exportingMetaDTO.isClientSchemaMigrated()
                                || exportingMetaDTO.isServerSchemaMigrated()
                                || exportingMetaDTO.getArtifactLastCommittedAt() == null
                                || isContextUpdated
                                || isDatasourceUpdated
                                || newActionUpdatedAt == null
                                || exportingMetaDTO.getArtifactLastCommittedAt().isBefore(newActionUpdatedAt);
                        if (isNewActionUpdated && newActionName != null) {
                            updatedActionSet.add(newActionName);
                            updatedIdentities.add(newAction.getGitSyncId());
                        }
                        newAction.sanitiseToExportDBObject();
                    });
                    artifactExchangeJson.getModifiedResources().putResource(FieldName.ACTION_LIST, updatedActionSet);
                    artifactExchangeJson
                            .getModifiedResources()
                            .getModifiedResourceIdentifiers()
                            .get(GitResourceType.QUERY_CONFIG)
                            .addAll(updatedIdentities);
                    artifactExchangeJson.setActionList(actionList);

                    // This is where we're removing global datasources that are unused in this application
                    artifactExchangeJson
                            .getDatasourceList()
                            .removeIf(datasource -> !dbNamesUsedInActions.contains(datasource.getName()));

                    return actionList;
                })
                .then();
    }

    protected List<NewAction> getExportableNewActions(List<NewAction> newActionList) {
        return newActionList;
    }

    @Override
    public Set<String> mapNameToIdForExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            List<NewAction> newActionList) {

        ArtifactBasedExportableService<NewAction, ?> artifactBasedExportableService =
                this.getArtifactBasedExportableService(exportingMetaDTO);

        Set<String> dbNamesUsedInActions = new HashSet<>();
        newActionList.forEach(newAction -> {
            newAction.setPluginId(mappedExportableResourcesDTO.getPluginMap().get(newAction.getPluginId()));
            newAction.setWorkspaceId(null);
            newAction.setPolicies(null);

            String publishedDbName = sanitizeDatasourceInActionDTO(
                    newAction.getPublishedAction(),
                    mappedExportableResourcesDTO.getDatasourceIdToNameMap(),
                    mappedExportableResourcesDTO.getPluginMap(),
                    null,
                    true);

            String unpublishedDbName = sanitizeDatasourceInActionDTO(
                    newAction.getUnpublishedAction(),
                    mappedExportableResourcesDTO.getDatasourceIdToNameMap(),
                    mappedExportableResourcesDTO.getPluginMap(),
                    null,
                    true);

            // Only add the datasource for this action to dbNamesUsed if it is not a module action
            if (hasExportableDatasource(newAction)) {
                dbNamesUsedInActions.add(publishedDbName);
                dbNamesUsedInActions.add(unpublishedDbName);
            }

            // Set unique id for action
            if (newAction.getUnpublishedAction() != null) {
                artifactBasedExportableService.mapExportableReferences(mappedExportableResourcesDTO, newAction, EDIT);
            }
            if (newAction.getPublishedAction() != null) {
                artifactBasedExportableService.mapExportableReferences(mappedExportableResourcesDTO, newAction, VIEW);
            }
        });
        return dbNamesUsedInActions;
    }

    protected boolean hasExportableDatasource(NewAction newAction) {
        return true;
    }
}
