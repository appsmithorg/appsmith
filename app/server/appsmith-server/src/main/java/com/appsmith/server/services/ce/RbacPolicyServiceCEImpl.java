package com.appsmith.server.services.ce;

import com.appsmith.server.domains.RbacPolicy;
import com.appsmith.server.repositories.RbacPolicyRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

public class RbacPolicyServiceCEImpl extends BaseService<RbacPolicyRepository, RbacPolicy, String> implements RbacPolicyServiceCE{

    public RbacPolicyServiceCEImpl(Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   RbacPolicyRepository repository,
                                   AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
