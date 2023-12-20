package com.appsmith.server.actioncollections.exports;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ActionCollectionExportableServiceImpl extends ActionCollectionExportableServiceCEImpl
        implements ExportableService<ActionCollection> {
    public ActionCollectionExportableServiceImpl(
            ActionCollectionService actionCollectionService, ActionPermission actionPermission) {
        super(actionCollectionService, actionPermission);
    }

    @Override
    public void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ApplicationJson applicationJson,
            SerialiseApplicationObjective serialiseFor) {
        Map<String, String> moduleInstanceIdToNameMap = mappedExportableResourcesDTO.getModuleInstanceIdToNameMap();

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
