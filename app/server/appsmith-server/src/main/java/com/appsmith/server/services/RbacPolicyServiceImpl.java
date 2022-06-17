package com.appsmith.server.services;

import com.appsmith.server.repositories.RbacPolicyRepository;
import com.appsmith.server.services.ce.RbacPolicyServiceCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class RbacPolicyServiceImpl extends RbacPolicyServiceCEImpl implements RbacPolicyService {

    public RbacPolicyServiceImpl(Scheduler scheduler,
                                 Validator validator,
                                 MongoConverter mongoConverter,
                                 ReactiveMongoTemplate reactiveMongoTemplate,
                                 RbacPolicyRepository repository,
                                 AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
