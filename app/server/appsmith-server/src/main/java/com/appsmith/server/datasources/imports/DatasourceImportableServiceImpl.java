package com.appsmith.server.datasources.imports;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.WorkspaceService;
import org.springframework.stereotype.Service;

@Service
public class DatasourceImportableServiceImpl extends DatasourceImportableServiceCEImpl
        implements ImportableService<Datasource> {

    public DatasourceImportableServiceImpl(
            DatasourceService datasourceService, WorkspaceService workspaceService, SequenceService sequenceService) {
        super(datasourceService, workspaceService, sequenceService);
    }
}
