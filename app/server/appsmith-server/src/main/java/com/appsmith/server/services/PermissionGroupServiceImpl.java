package com.appsmith.server.services;

import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ce.PermissionGroupServiceCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class PermissionGroupServiceImpl extends PermissionGroupServiceCEImpl implements PermissionGroupService {

    public PermissionGroupServiceImpl(Scheduler scheduler,
                                      Validator validator,
                                      MongoConverter mongoConverter,
                                      ReactiveMongoTemplate reactiveMongoTemplate,
                                      PermissionGroupRepository repository,
                                      AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
