package com.appsmith.server.services.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;


public class PermissionGroupServiceCEImpl extends BaseService<PermissionGroupRepository, PermissionGroup, String>
        implements PermissionGroupServiceCE {

    public PermissionGroupServiceCEImpl(Scheduler scheduler,
                                        Validator validator,
                                        MongoConverter mongoConverter,
                                        ReactiveMongoTemplate reactiveMongoTemplate,
                                        PermissionGroupRepository repository,
                                        AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
