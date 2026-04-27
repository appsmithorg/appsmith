package com.appsmith.server.datasources.importable;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import org.springframework.stereotype.Service;

@Service
public class DatasourceImportableServiceImpl extends DatasourceImportableServiceCEImpl
        implements ImportableService<Datasource> {

    public DatasourceImportableServiceImpl(
            DatasourceService datasourceService,
            WorkspaceService workspaceService,
            DatasourceStorageService datasourceStorageService,
            DatasourcePermission datasourcePermission) {
        super(datasourceService, workspaceService, datasourceStorageService, datasourcePermission);
    }
}
