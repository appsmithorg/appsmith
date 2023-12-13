package com.appsmith.server.jslibs.base;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.PagePermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
@Slf4j
public class CustomJSLibServiceImpl extends CustomJSLibServiceCEImpl implements CustomJSLibService {
    public CustomJSLibServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            CustomJSLibRepository repository,
            ApplicationService applicationService,
            NewPageService newPageService,
            PagePermission pagePermission,
            AnalyticsService analyticsService,
            ContextBasedJsLibService<Application> applicationContextBasedJsLibService) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                applicationService,
                newPageService,
                pagePermission,
                analyticsService,
                applicationContextBasedJsLibService);
    }
}
