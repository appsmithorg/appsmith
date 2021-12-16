package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Permission;
import com.appsmith.server.repositories.PermissionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;


public class PermissionServiceCEImpl extends BaseService<PermissionRepository, Permission, String>
        implements PermissionServiceCE {

    private final PermissionRepository repository;

    @Autowired
    public PermissionServiceCEImpl(Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   PermissionRepository repository,
                                   AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
    }
}
