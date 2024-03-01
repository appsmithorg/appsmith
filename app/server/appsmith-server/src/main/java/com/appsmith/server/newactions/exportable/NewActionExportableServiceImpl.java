package com.appsmith.server.newactions.exportable;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NewActionExportableServiceImpl extends NewActionExportableServiceCEImpl
        implements ExportableService<NewAction> {

    protected final ArtifactBasedExportableService<NewAction, Package> packageExportableService;

    public NewActionExportableServiceImpl(
            ActionPermission actionPermission,
            ArtifactBasedExportableService<NewAction, Application> applicationExportableService,
            ArtifactBasedExportableService<NewAction, Package> packageExportableService) {
        super(actionPermission, applicationExportableService);
        this.packageExportableService = packageExportableService;
    }

    @Override
    public ArtifactBasedExportableService<NewAction, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        if (FieldName.APPLICATION.equals(exportingMetaDTO.getArtifactType())) {
            return applicationExportableService;
        } else {
            return packageExportableService;
        }
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
    public void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseFor) {
        Map<String, String> moduleInstanceIdToNameMap = mappedExportableResourcesDTO.getModuleInstanceIdToNameMap();

        for (NewAction newAction : artifactExchangeJson.getActionList()) {
            if (Boolean.TRUE.equals(newAction.getIsPublic())) {
                String originalModuleInstanceId = newAction.getModuleInstanceId();
                String originalRootModuleInstanceId = newAction.getRootModuleInstanceId();

                newAction.setModuleInstanceId(moduleInstanceIdToNameMap.get(originalModuleInstanceId));
                newAction.setRootModuleInstanceId(moduleInstanceIdToNameMap.get(originalRootModuleInstanceId));
            }
        }
    }
}
