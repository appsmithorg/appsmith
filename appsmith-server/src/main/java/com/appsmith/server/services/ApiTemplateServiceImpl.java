package com.appsmith.server.services;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.repositories.ApiTemplateRepository;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class ApiTemplateServiceImpl extends BaseService<ApiTemplateRepository, ApiTemplate, String> implements ApiTemplateService {

    public ApiTemplateServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApiTemplateRepository repository,
                                  AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
