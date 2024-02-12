package com.appsmith.server.actioncollections.exportable;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
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
public class ActionCollectionExportableServiceImpl extends ActionCollectionExportableServiceCEImpl
        implements ExportableService<ActionCollection> {

    protected final ArtifactBasedExportableService<ActionCollection, Package> packageExportableService;

    public ActionCollectionExportableServiceImpl(
            ActionPermission actionPermission,
            ArtifactBasedExportableService<ActionCollection, Application> applicationExportableService,
            ArtifactBasedExportableService<ActionCollection, Package> packageExportableService) {
        super(actionPermission, applicationExportableService);
        this.packageExportableService = packageExportableService;
    }

    @Override
    public ArtifactBasedExportableService<ActionCollection, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        if (FieldName.APPLICATION.equals(exportingMetaDTO.getArtifactType())) {
            return applicationExportableService;
        } else {
            return packageExportableService;
        }
    }

    @Override
    protected List<ActionCollection> getExportableActionCollections(List<ActionCollection> actionCollectionList) {
        List<ActionCollection> exportableActionCollectionsFromSuper =
                super.getExportableActionCollections(actionCollectionList);

        return exportableActionCollectionsFromSuper.stream()
                .filter(actionCollection -> actionCollection.getRootModuleInstanceId() == null
                        || Boolean.TRUE.equals(actionCollection.getIsPublic()))
                .toList();
    }

    @Override
    public void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ArtifactExchangeJson artifactExchangeJson,
            SerialiseArtifactObjective serialiseFor) {
        Map<String, String> moduleInstanceIdToNameMap = mappedExportableResourcesDTO.getModuleInstanceIdToNameMap();

        for (ActionCollection actionCollection : artifactExchangeJson.getActionCollectionList()) {
            if (Boolean.TRUE.equals(actionCollection.getIsPublic())) {
                String originalModuleInstanceId = actionCollection.getModuleInstanceId();
                String originalRootModuleInstanceId = actionCollection.getRootModuleInstanceId();

                actionCollection.setModuleInstanceId(moduleInstanceIdToNameMap.get(originalModuleInstanceId));
                actionCollection.setRootModuleInstanceId(moduleInstanceIdToNameMap.get(originalRootModuleInstanceId));
            }
        }
    }
}
