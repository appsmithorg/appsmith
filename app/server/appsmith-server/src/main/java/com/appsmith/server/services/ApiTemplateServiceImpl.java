package com.appsmith.server.services;

import com.appsmith.server.repositories.ApiTemplateRepository;
import com.appsmith.server.services.ce.ApiTemplateServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
@Slf4j
public class ApiTemplateServiceImpl extends ApiTemplateServiceCEImpl implements ApiTemplateService {

    public ApiTemplateServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApiTemplateRepository repository,
                                  AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
