package com.appsmith.server.newactions.exports;

import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NewActionExportableServiceImpl extends NewActionExportableServiceCEImpl
        implements ExportableService<NewAction> {

    public NewActionExportableServiceImpl(NewActionService newActionService, ActionPermission actionPermission) {
        super(newActionService, actionPermission);
    }

    @Override
    protected List<NewAction> getExportableNewActions(List<NewAction> newActionList) {

        List<NewAction> exportableNewActionsFromSuper = super.getExportableNewActions(newActionList);

        return exportableNewActionsFromSuper.stream()
                .filter(newAction ->
                        newAction.getRootModuleInstanceId() == null || Boolean.TRUE.equals(newAction.getIsPublic()))
                .toList();
    }

    @Override
    protected boolean hasExportableDatasource(NewAction newAction) {
        return newAction.getRootModuleInstanceId() == null;
    }

    @Override
    public void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseFor) {
        Map<String, String> moduleInstanceIdToNameMap = mappedExportableResourcesDTO.getModuleInstanceIdToNameMap();

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        for (NewAction newAction : applicationJson.getActionList()) {
            if (Boolean.TRUE.equals(newAction.getIsPublic())) {
                String originalModuleInstanceId = newAction.getModuleInstanceId();
                String originalRootModuleInstanceId = newAction.getRootModuleInstanceId();

                newAction.setModuleInstanceId(moduleInstanceIdToNameMap.get(originalModuleInstanceId));
                newAction.setRootModuleInstanceId(moduleInstanceIdToNameMap.get(originalRootModuleInstanceId));
            }
        }
    }
}
