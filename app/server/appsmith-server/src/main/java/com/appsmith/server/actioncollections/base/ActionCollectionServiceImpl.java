package com.appsmith.server.actioncollections.base;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class ActionCollectionServiceImpl extends ActionCollectionServiceCEImpl implements ActionCollectionService {

    public ActionCollectionServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ActionCollectionRepository repository,
            AnalyticsService analyticsService,
            NewActionService newActionService,
            NewPageService newPageService,
            PolicyGenerator policyGenerator,
            ApplicationService applicationService,
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                newActionService,
                newPageService,
                policyGenerator,
                applicationService,
                responseUtils,
                applicationPermission,
                pagePermission,
                actionPermission);
    }
}
