package com.appsmith.server.artifacts.base;

import com.appsmith.server.artifacts.base.artifactbased.ArtifactBasedService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.services.AnalyticsService;
import org.springframework.stereotype.Service;

@Service
public class ArtifactServiceImpl extends ArtifactServiceCEImpl implements ArtifactService {

    public ArtifactServiceImpl(
            ArtifactBasedService<Application> applicationService, AnalyticsService analyticsService) {
        super(applicationService, analyticsService);
    }
}
