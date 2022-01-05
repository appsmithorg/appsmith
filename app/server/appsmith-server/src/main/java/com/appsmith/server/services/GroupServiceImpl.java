package com.appsmith.server.services;

import com.appsmith.server.repositories.GroupRepository;
import com.appsmith.server.services.ce.GroupServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
@Slf4j
public class GroupServiceImpl extends GroupServiceCEImpl implements GroupService {

    public GroupServiceImpl(Scheduler scheduler,
                            Validator validator,
                            MongoConverter mongoConverter,
                            ReactiveMongoTemplate reactiveMongoTemplate,
                            GroupRepository repository,
                            AnalyticsService analyticsService,
                            SessionUserService sessionUserService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                sessionUserService);
    }
}
