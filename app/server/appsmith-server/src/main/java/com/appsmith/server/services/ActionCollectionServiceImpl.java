package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.ce.ActionCollectionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import jakarta.validation.Validator;

@Service
@Slf4j
public class ActionCollectionServiceImpl extends ActionCollectionServiceCEImpl implements ActionCollectionService {

    public ActionCollectionServiceImpl(Scheduler scheduler,
                                       Validator validator,
                                       MongoConverter mongoConverter,
                                       ReactiveMongoTemplate reactiveMongoTemplate,
                                       ActionCollectionRepository repository,
                                       AnalyticsService analyticsService,
                                       NewActionService newActionService,
                                       PolicyGenerator policyGenerator,
                                       ApplicationService applicationService,
                                       ResponseUtils responseUtils,
                                       ApplicationPermission applicationPermission,
                                       ActionPermission actionPermission) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                newActionService, policyGenerator, applicationService, responseUtils, applicationPermission,
                actionPermission);

    }
}
