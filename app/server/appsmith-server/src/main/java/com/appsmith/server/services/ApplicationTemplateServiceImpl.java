package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.imports.internal.ImportApplicationService;
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
            ImportApplicationService importApplicationService,
            ExportApplicationService exportApplicationService,
            AnalyticsService analyticsService,
            UserDataService userDataService,
            ApplicationService applicationService,
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            ObjectMapper objectMapper) {
        super(
                cloudServicesConfig,
                releaseNotesService,
                importApplicationService,
                exportApplicationService,
                analyticsService,
                userDataService,
                applicationService,
                responseUtils,
                applicationPermission,
                objectMapper);
    }
}
