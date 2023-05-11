package com.appsmith.server.services;

import com.appsmith.server.repositories.DatasourceConfigurationStorageRepository;
import com.appsmith.server.services.ce.DatasourceConfigurationStorageServiceCEImpl;
import com.appsmith.server.solutions.DatasourceConfigurationTransferSolution;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class DatasourceConfigurationStorageServiceImpl extends DatasourceConfigurationStorageServiceCEImpl implements DatasourceConfigurationStorageService {

    public DatasourceConfigurationStorageServiceImpl(DatasourceConfigurationStorageRepository repository,
                                                     DatasourceConfigurationTransferSolution datasourceConfigurationTransferSolution) {

        super(repository, datasourceConfigurationTransferSolution);
    }
}
