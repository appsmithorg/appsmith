package com.appsmith.server.layouts;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.helpers.ObservationHelperImpl;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.onload.internal.OnLoadExecutablesUtil;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.stereotype.Service;

@Service
public class UpdateLayoutServiceImpl extends UpdateLayoutServiceCEImpl implements UpdateLayoutService {

    public UpdateLayoutServiceImpl(
            OnLoadExecutablesUtil onLoadExecutablesUtil,
            SessionUserService sessionUserService,
            NewPageService newPageService,
            AnalyticsService analyticsService,
            PagePermission pagePermission,
            ApplicationService applicationService,
            ObjectMapper objectMapper,
            ObservationRegistry observationRegistry,
            ObservationHelperImpl observationHelper) {
        super(
                onLoadExecutablesUtil,
                sessionUserService,
                newPageService,
                analyticsService,
                pagePermission,
                applicationService,
                objectMapper,
                observationRegistry,
                observationHelper);
    }
}
