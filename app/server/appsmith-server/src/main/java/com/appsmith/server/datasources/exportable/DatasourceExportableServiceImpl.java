package com.appsmith.server.datasources.exportable;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import org.springframework.stereotype.Service;

@Service
public class DatasourceExportableServiceImpl extends DatasourceExportableServiceCEImpl
        implements ExportableService<Datasource> {

    public DatasourceExportableServiceImpl(
            DatasourceService datasourceService,
            DatasourcePermission datasourcePermission,
            WorkspaceService workspaceService,
            DatasourceStorageService datasourceStorageService) {
        super(datasourceService, datasourcePermission, workspaceService, datasourceStorageService);
    }
}
