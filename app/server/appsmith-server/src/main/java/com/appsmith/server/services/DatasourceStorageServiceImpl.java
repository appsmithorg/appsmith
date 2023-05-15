package com.appsmith.server.services;

import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.ce.DatasourceStorageServiceCEImpl;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class DatasourceStorageServiceImpl extends DatasourceStorageServiceCEImpl implements DatasourceStorageService {

    public DatasourceStorageServiceImpl(Scheduler scheduler,
                                                     Validator validator,
                                                     MongoConverter mongoConverter,
                                                     ReactiveMongoTemplate reactiveMongoTemplate,
                                                     DatasourceStorageRepository repository,
                                                     AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
