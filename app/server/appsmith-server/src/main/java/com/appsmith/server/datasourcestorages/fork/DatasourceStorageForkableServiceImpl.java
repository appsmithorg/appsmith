package com.appsmith.server.datasourcestorages.fork;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.fork.forkable.ForkableService;
import org.springframework.stereotype.Service;

@Service
public class DatasourceStorageForkableServiceImpl extends DatasourceStorageForkableServiceCEImpl
        implements ForkableService<DatasourceStorage> {}
