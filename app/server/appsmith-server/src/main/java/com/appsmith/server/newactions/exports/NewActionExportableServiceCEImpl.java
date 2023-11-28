package com.appsmith.server.newactions.exports;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.solutions.ActionPermission;
import org.apache.commons.lang3.StringUtils;
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
import static com.appsmith.server.helpers.ImportExportUtils.sanitizeDatasourceInActionDTO;

public class NewActionExportableServiceCEImpl implements ExportableServiceCE<NewAction> {

    private final NewActionService newActionService;
    private final ActionPermission actionPermission;

    public NewActionExportableServiceCEImpl(NewActionService newActionService, ActionPermission actionPermission) {
        this.newActionService = newActionService;
        this.actionPermission = actionPermission;
    }

    // Requires datasourceIdToNameMap, pageIdToNameMap, pluginMap, collectionIdToNameMap
    // Updates actionId to name map in exportable resources. Also directly updates required collection information in
    // application json
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {

        Optional<AclPermission> optionalPermission = Optional.ofNullable(actionPermission.getExportPermission(
                exportingMetaDTO.getIsGitSync(), exportingMetaDTO.getExportWithConfiguration()));

        Flux<NewAction> actionFlux =
                newActionService.findByListOfPageIds(exportingMetaDTO.getUnpublishedPages(), optionalPermission);

        return actionFlux
                .collectList()
                .flatMap(newActionList -> {
                    Set<String> dbNamesUsedInActions =
                            mapNameToIdForExportableEntities(mappedExportableResourcesDTO, newActionList);
                    return Mono.zip(Mono.just(newActionList), Mono.just(dbNamesUsedInActions));
                })
                .map(tuple -> {
                    List<NewAction> actionList = tuple.getT1();
                    Set<String> dbNamesUsedInActions = tuple.getT2();
                    Set<String> updatedActionSet = new HashSet<>();
                    actionList.forEach(newAction -> {
                        ActionDTO unpublishedActionDTO = newAction.getUnpublishedAction();
                        ActionDTO publishedActionDTO = newAction.getPublishedAction();
                        ActionDTO actionDTO = unpublishedActionDTO != null ? unpublishedActionDTO : publishedActionDTO;
                        String newActionName = actionDTO != null
                                ? actionDTO.getValidName() + NAME_SEPARATOR + actionDTO.getPageId()
                                : null;
                        // TODO: check whether resource updated after last commit - move to a function
                        String pageName = actionDTO.getPageId();
                        // we've replaced the datasource id with datasource name in previous step
                        boolean isDatasourceUpdated = ImportExportUtils.isDatasourceUpdatedSinceLastCommit(
                                mappedExportableResourcesDTO.getDatasourceNameToUpdatedAtMap(),
                                actionDTO,
                                exportingMetaDTO.getApplicationLastCommittedAt());

                        boolean isPageUpdated = ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName);
                        Instant newActionUpdatedAt = newAction.getUpdatedAt();
                        boolean isNewActionUpdated = exportingMetaDTO.isClientSchemaMigrated()
                                || exportingMetaDTO.isServerSchemaMigrated()
                                || exportingMetaDTO.getApplicationLastCommittedAt() == null
                                || isPageUpdated
                                || isDatasourceUpdated
                                || newActionUpdatedAt == null
                                || exportingMetaDTO
                                        .getApplicationLastCommittedAt()
                                        .isBefore(newActionUpdatedAt);
                        if (isNewActionUpdated && newActionName != null) {
                            updatedActionSet.add(newActionName);
                        }
                        newAction.sanitiseToExportDBObject();
                    });
                    applicationJson.getUpdatedResources().put(FieldName.ACTION_LIST, updatedActionSet);
                    applicationJson.setActionList(actionList);

                    // This is where we're removing global datasources that are unused in this application
                    applicationJson
                            .getDatasourceList()
                            .removeIf(datasource -> !dbNamesUsedInActions.contains(datasource.getName()));

                    return actionList;
                })
                .then();
    }

    @Override
    public Set<String> mapNameToIdForExportableEntities(
            MappedExportableResourcesDTO mappedExportableResourcesDTO, List<NewAction> newActionList) {
        Set<String> dbNamesUsedInActions = new HashSet<>();
        newActionList.forEach(newAction -> {
            newAction.setPluginId(mappedExportableResourcesDTO.getPluginMap().get(newAction.getPluginId()));
            newAction.setWorkspaceId(null);
            newAction.setPolicies(null);
            newAction.setApplicationId(null);
            dbNamesUsedInActions.add(sanitizeDatasourceInActionDTO(
                    newAction.getPublishedAction(),
                    mappedExportableResourcesDTO.getDatasourceIdToNameMap(),
                    mappedExportableResourcesDTO.getPluginMap(),
                    null,
                    true));
            dbNamesUsedInActions.add(sanitizeDatasourceInActionDTO(
                    newAction.getUnpublishedAction(),
                    mappedExportableResourcesDTO.getDatasourceIdToNameMap(),
                    mappedExportableResourcesDTO.getPluginMap(),
                    null,
                    true));

            // Set unique id for action
            if (newAction.getUnpublishedAction() != null) {
                ActionDTO actionDTO = newAction.getUnpublishedAction();
                actionDTO.setPageId(
                        mappedExportableResourcesDTO.getPageIdToNameMap().get(actionDTO.getPageId() + EDIT));

                if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                        && mappedExportableResourcesDTO
                                .getCollectionIdToNameMap()
                                .containsKey(actionDTO.getCollectionId())) {
                    actionDTO.setCollectionId(mappedExportableResourcesDTO
                            .getCollectionIdToNameMap()
                            .get(actionDTO.getCollectionId()));
                }

                final String updatedActionId = actionDTO.getPageId() + "_" + actionDTO.getValidName();
                mappedExportableResourcesDTO.getActionIdToNameMap().put(newAction.getId(), updatedActionId);
                newAction.setId(updatedActionId);
            }
            if (newAction.getPublishedAction() != null) {
                ActionDTO actionDTO = newAction.getPublishedAction();
                actionDTO.setPageId(
                        mappedExportableResourcesDTO.getPageIdToNameMap().get(actionDTO.getPageId() + VIEW));

                if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                        && mappedExportableResourcesDTO
                                .getCollectionIdToNameMap()
                                .containsKey(actionDTO.getCollectionId())) {
                    actionDTO.setCollectionId(mappedExportableResourcesDTO
                            .getCollectionIdToNameMap()
                            .get(actionDTO.getCollectionId()));
                }

                if (!mappedExportableResourcesDTO.getActionIdToNameMap().containsValue(newAction.getId())) {
                    final String updatedActionId = actionDTO.getPageId() + "_" + actionDTO.getValidName();
                    mappedExportableResourcesDTO.getActionIdToNameMap().put(newAction.getId(), updatedActionId);
                    newAction.setId(updatedActionId);
                }
            }
        });
        return dbNamesUsedInActions;
    }
}
