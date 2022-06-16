package com.appsmith.server.services.ce;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

public class UserGroupServiceCEImpl extends BaseService<UserGroupRepository, UserGroup, String> implements UserGroupServiceCE{

    public UserGroupServiceCEImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  UserGroupRepository repository,
                                  AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
