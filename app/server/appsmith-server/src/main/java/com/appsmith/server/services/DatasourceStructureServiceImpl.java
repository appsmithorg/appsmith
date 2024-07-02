package com.appsmith.server.services;

import com.appsmith.server.repositories.cakes.DatasourceStorageStructureRepositoryCake;
import com.appsmith.server.services.ce.DatasourceStructureServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DatasourceStructureServiceImpl extends DatasourceStructureServiceCEImpl
        implements DatasourceStructureService {
    private String tempChange;

    public DatasourceStructureServiceImpl(DatasourceStorageStructureRepositoryCake repository) {
        super(repository);
    }
}
