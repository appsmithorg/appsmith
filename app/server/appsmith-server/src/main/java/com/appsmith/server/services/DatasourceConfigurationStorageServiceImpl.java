package com.appsmith.server.services;

import com.appsmith.server.repositories.DatasourceConfigurationStorageRepository;
import com.appsmith.server.services.ce.DatasourceConfigurationStorageServiceCEImpl;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class DatasourceConfigurationStorageServiceImpl extends DatasourceConfigurationStorageServiceCEImpl implements DatasourceConfigurationStorageService {

    public DatasourceConfigurationStorageServiceImpl(Scheduler scheduler,
                                                     Validator validator,
                                                     MongoConverter mongoConverter,
                                                     ReactiveMongoTemplate reactiveMongoTemplate,
                                                     DatasourceConfigurationStorageRepository repository,
                                                     AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
