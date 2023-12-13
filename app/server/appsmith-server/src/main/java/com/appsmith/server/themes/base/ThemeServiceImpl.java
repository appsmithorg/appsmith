package com.appsmith.server.themes.base;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Slf4j
@Service
public class ThemeServiceImpl extends ThemeServiceCEImpl implements ThemeService {
    public ThemeServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ThemeRepository repository,
            AnalyticsService analyticsService,
            ApplicationRepository applicationRepository,
            ApplicationService applicationService,
            NewPageService newPageService,
            PolicyGenerator policyGenerator,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                applicationRepository,
                applicationService,
                newPageService,
                policyGenerator,
                applicationPermission,
                pagePermission);
    }
}
