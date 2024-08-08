package com.appsmith.server.jslibs.base;

import com.appsmith.server.domains.Application;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.repositories.cakes.CustomJSLibRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class CustomJSLibServiceImpl extends CustomJSLibServiceCEImpl implements CustomJSLibService {
    public CustomJSLibServiceImpl(
            Validator validator,
            CustomJSLibRepository repositoryDirect,
            CustomJSLibRepositoryCake repository,
            AnalyticsService analyticsService,
            ContextBasedJsLibService<Application> applicationContextBasedJsLibService) {
        super(validator, repositoryDirect, repository, analyticsService, applicationContextBasedJsLibService);
    }
}
