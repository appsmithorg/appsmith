package com.appsmith.server.services;

import com.appsmith.server.repositories.ConfigurationStorageRepository;
import com.appsmith.server.services.ce.ConfigurationStorageServiceCEImpl;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class ConfigurationStorageServiceImpl extends ConfigurationStorageServiceCEImpl implements ConfigurationStorageService {

    public ConfigurationStorageServiceImpl(Scheduler scheduler,
                                           Validator validator,
                                           MongoConverter mongoConverter,
                                           ReactiveMongoTemplate reactiveMongoTemplate,
                                           ConfigurationStorageRepository repository,
                                           AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
