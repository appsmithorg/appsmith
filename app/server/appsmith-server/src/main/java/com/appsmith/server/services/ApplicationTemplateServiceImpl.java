package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.CacheableTemplateHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.services.ce.ApplicationTemplateServiceCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ApplicationTemplateServiceImpl extends ApplicationTemplateServiceCEImpl
        implements ApplicationTemplateService {

    public ApplicationTemplateServiceImpl(
            CloudServicesConfig cloudServicesConfig,
            ReleaseNotesService releaseNotesService,
            ImportService importService,
            ExportService exportService,
            AnalyticsService analyticsService,
            UserDataService userDataService,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            ObjectMapper objectMapper,
            SessionUserService sessionUserService,
            CacheableTemplateHelper cacheableTemplateHelper) {
        super(
                cloudServicesConfig,
                releaseNotesService,
                importService,
                exportService,
                analyticsService,
                applicationService,
                applicationPermission,
                objectMapper,
                sessionUserService,
                cacheableTemplateHelper);
    }
}
