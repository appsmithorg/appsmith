package com.appsmith.server.models.datasources.fork;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.fork.forkable.ForkableService;
import com.appsmith.server.models.datasources.base.DatasourceService;
import com.appsmith.server.models.datasourcestorages.base.DatasourceStorageService;
import org.springframework.stereotype.Service;

@Service
public class DatasourceForkableServiceImpl extends DatasourceForkableServiceCEImpl
        implements ForkableService<Datasource> {

    public DatasourceForkableServiceImpl(
            DatasourceService datasourceService,
            DatasourceStorageService datasourceStorageService,
            ForkableService<DatasourceStorage> datasourceStorageForkableService) {
        super(datasourceService, datasourceStorageService, datasourceStorageForkableService);
    }
}
