package com.appsmith.server.services;

import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.services.ce.UserGroupServiceCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class UserGroupServiceImpl extends UserGroupServiceCEImpl implements UserGroupService {

    public UserGroupServiceImpl(Scheduler scheduler,
                                Validator validator,
                                MongoConverter mongoConverter,
                                ReactiveMongoTemplate reactiveMongoTemplate,
                                UserGroupRepository repository,
                                AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
