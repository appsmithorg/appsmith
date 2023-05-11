package com.appsmith.server.solutions;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import com.appsmith.server.repositories.DatasourceConfigurationStorageRepository;
import com.appsmith.server.services.DatasourceConfigurationStorageService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.solutions.ce.DatasourceConfigurationTransferSolutionCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.HashSet;

@Service
@Slf4j
public class DatasourceConfigurationTransferSolutionImpl extends DatasourceConfigurationTransferSolutionCEImpl implements DatasourceConfigurationTransferSolution {

    public DatasourceConfigurationTransferSolutionImpl(DatasourceService datasourceService,
                                                       DatasourceConfigurationStorageRepository datasourceConfigurationStorageRepository) {
        super(datasourceService, datasourceConfigurationStorageRepository);
    }

}
