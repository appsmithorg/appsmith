package com.appsmith.server.services;

import com.appsmith.server.repositories.DatasourceConfigurationStructureRepository;
import com.appsmith.server.services.ce.DatasourceConfigurationStructureServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DatasourceConfigurationStructureServiceImpl extends DatasourceConfigurationStructureServiceCEImpl implements DatasourceConfigurationStructureService {
    public DatasourceConfigurationStructureServiceImpl(DatasourceConfigurationStructureRepository repository) {
        super(repository);
    }
}
