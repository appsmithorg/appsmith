package com.appsmith.server.applications.jslibs;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.jslibs.context.ContextBasedJsLibService;
import com.appsmith.server.repositories.ApplicationRepository;
import org.springframework.stereotype.Service;

@Service
public class ApplicationJsLibServiceImpl extends ApplicationJsLibServiceCEImpl
        implements ContextBasedJsLibService<Application> {
    public ApplicationJsLibServiceImpl(
            ApplicationService applicationService, ApplicationRepository applicationRepository) {
        super(applicationService);
    }
}
