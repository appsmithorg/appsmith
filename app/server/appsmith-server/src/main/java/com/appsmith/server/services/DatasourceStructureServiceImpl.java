package com.appsmith.server.services;

import com.appsmith.server.repositories.DatasourceStorageStructureRepository;
import com.appsmith.server.services.ce.DatasourceStructureServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DatasourceStructureServiceImpl extends DatasourceStructureServiceCEImpl
        implements DatasourceStructureService {
    public DatasourceStructureServiceImpl(DatasourceStorageStructureRepository repository) {
        super(repository);
    }
}
