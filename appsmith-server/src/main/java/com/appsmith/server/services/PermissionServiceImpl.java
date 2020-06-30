package com.appsmith.server.services;

import com.appsmith.server.domains.Permission;
import com.appsmith.server.repositories.PermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class PermissionServiceImpl extends BaseService<PermissionRepository, Permission, String> implements PermissionService {

    private final PermissionRepository repository;

    @Autowired
    public PermissionServiceImpl(Scheduler scheduler,
                                 Validator validator,
                                 MongoConverter mongoConverter,
                                 ReactiveMongoTemplate reactiveMongoTemplate,
                                 PermissionRepository repository,
                                 AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
    }
}
