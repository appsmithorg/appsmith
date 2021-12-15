package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.CommentRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.services.ce.CommentServiceCEImpl;
import com.appsmith.server.solutions.EmailEventHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class CommentServiceImpl extends CommentServiceCEImpl implements CommentService {

    public CommentServiceImpl(Scheduler scheduler,
                              Validator validator,
                              MongoConverter mongoConverter,
                              ReactiveMongoTemplate reactiveMongoTemplate,
                              CommentRepository repository,
                              AnalyticsService analyticsService,
                              CommentThreadRepository threadRepository,
                              UserService userService,
                              SessionUserService sessionUserService,
                              ApplicationService applicationService,
                              NewPageService newPageService,
                              NotificationService notificationService,
                              PolicyGenerator policyGenerator,
                              PolicyUtils policyUtils,
                              EmailEventHandler emailEventHandler,
                              UserDataRepository userDataRepository,
                              SequenceService sequenceService,
                              ResponseUtils responseUtils) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                threadRepository, userService, sessionUserService, applicationService, newPageService,
                notificationService, policyGenerator, policyUtils, emailEventHandler, userDataRepository,
                sequenceService, responseUtils);

    }
}
