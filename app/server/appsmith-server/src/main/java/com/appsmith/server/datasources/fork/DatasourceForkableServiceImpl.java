package com.appsmith.server.datasources.fork;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.fork.forkable.ForkableService;
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
