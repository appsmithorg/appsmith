package com.appsmith.server.actioncollections.exports;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.SerialiseArtifactObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ActionCollectionExportableServiceImpl extends ActionCollectionExportableServiceCEImpl
        implements ExportableService<ActionCollection> {
    public ActionCollectionExportableServiceImpl(
            ActionCollectionService actionCollectionService, ActionPermission actionPermission) {
        super(actionCollectionService, actionPermission);
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

        ApplicationJson applicationJson = (ApplicationJson) artifactExchangeJson;
        for (ActionCollection actionCollection : applicationJson.getActionCollectionList()) {
            if (Boolean.TRUE.equals(actionCollection.getIsPublic())) {
                String originalModuleInstanceId = actionCollection.getModuleInstanceId();
                String originalRootModuleInstanceId = actionCollection.getRootModuleInstanceId();

                actionCollection.setModuleInstanceId(moduleInstanceIdToNameMap.get(originalModuleInstanceId));
                actionCollection.setRootModuleInstanceId(moduleInstanceIdToNameMap.get(originalRootModuleInstanceId));
            }
        }
    }
}
