package com.appsmith.server.newpages.base;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationSnapshotRepositoryCake;
import com.appsmith.server.repositories.NewPageRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.UserDataService;
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
public class NewPageServiceImpl extends NewPageServiceCEImpl implements NewPageService {

    public NewPageServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            NewPageRepositoryCake repository,
            AnalyticsService analyticsService,
            ApplicationService applicationService,
            UserDataService userDataService,
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ApplicationSnapshotRepositoryCake applicationSnapshotRepository) {

        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                applicationService,
                userDataService,
                responseUtils,
                applicationPermission,
                pagePermission,
                applicationSnapshotRepository);
    }
}
