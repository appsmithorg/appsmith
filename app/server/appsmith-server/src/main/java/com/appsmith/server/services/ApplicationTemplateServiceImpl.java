package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.services.ce.ApplicationTemplateServiceCEImpl;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ApplicationTemplateServiceImpl extends ApplicationTemplateServiceCEImpl implements ApplicationTemplateService {
    public ApplicationTemplateServiceImpl(CloudServicesConfig cloudServicesConfig,
                                          ReleaseNotesService releaseNotesService,
                                          ImportExportApplicationService importExportApplicationService,
                                          AnalyticsService analyticsService) {
        super(cloudServicesConfig, releaseNotesService, importExportApplicationService, analyticsService);
    }
}
