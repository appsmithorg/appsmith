package com.appsmith.server.services;

import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.Set;

@Service
public class GroupServiceImpl extends BaseService<GroupRepository, Group, String> implements GroupService {

    private final GroupRepository repository;

    @Autowired
    public GroupServiceImpl(Scheduler scheduler,
                            Validator validator,
                            MongoConverter mongoConverter,
                            ReactiveMongoTemplate reactiveMongoTemplate,
                            GroupRepository repository,
                            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
    }

    @Override
    public Flux<Group> getAllById(Set<String> ids) {
        return this.repository.findAllById(ids);
    }
}
