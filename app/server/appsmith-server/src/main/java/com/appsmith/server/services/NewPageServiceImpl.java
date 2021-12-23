package com.appsmith.server.services;

import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.services.ce.NewPageServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
@Slf4j
public class NewPageServiceImpl extends NewPageServiceCEImpl implements NewPageService {

    public NewPageServiceImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              NewPageRepository repository,
                              AnalyticsService analyticsService,
                              ApplicationService applicationService,
                              UserDataService userDataService,
                              ResponseUtils responseUtils) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                applicationService, userDataService, responseUtils);
    }
}
