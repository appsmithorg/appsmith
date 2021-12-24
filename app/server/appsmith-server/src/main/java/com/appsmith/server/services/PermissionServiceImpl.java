package com.appsmith.server.services;

import com.appsmith.server.repositories.PermissionRepository;
import com.appsmith.server.services.ce.PermissionServiceCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class PermissionServiceImpl extends PermissionServiceCEImpl implements PermissionService {

    public PermissionServiceImpl(Scheduler scheduler,
                                 Validator validator,
                                 MongoConverter mongoConverter,
                                 ReactiveMongoTemplate reactiveMongoTemplate,
                                 PermissionRepository repository,
                                 AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
