package com.appsmith.server.services;

import com.appsmith.server.domains.Layout;
import com.appsmith.server.repositories.LayoutRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class LayoutServiceImpl extends BaseService<LayoutRepository, Layout, String> implements LayoutService {

    @Autowired
    public LayoutServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             LayoutRepository repository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository);
    }
}
