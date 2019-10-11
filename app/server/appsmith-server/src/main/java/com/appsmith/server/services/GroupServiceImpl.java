package com.appsmith.server.services;

import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.GroupRepository;
import com.segment.analytics.Analytics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class GroupServiceImpl extends BaseService<GroupRepository, Group, String> implements GroupService  {

    private final GroupRepository repository;

    @Autowired
    public GroupServiceImpl(Scheduler scheduler,
                            Validator validator,
                            MongoConverter mongoConverter,
                            ReactiveMongoTemplate reactiveMongoTemplate,
                            GroupRepository repository,
                            Analytics analytics,
                            SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analytics, sessionUserService);
        this.repository = repository;
    }
}
