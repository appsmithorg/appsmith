package com.appsmith.server.jslibs.base;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ApplicationPermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class CustomJSLibServiceImpl extends CustomJSLibServiceCEImpl implements CustomJSLibService {
    public CustomJSLibServiceImpl(
            Validator validator,
            CustomJSLibRepository repository,
            AnalyticsService analyticsService,
            ContextBasedJsLibService<Application> applicationContextBasedJsLibService,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission) {
        super(
                validator,
                repository,
                analyticsService,
                applicationContextBasedJsLibService,
                applicationService,
                applicationPermission);
    }
}
