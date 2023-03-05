package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.services.ce.AnalyticsServiceCEImpl;
import com.google.gson.Gson;
import com.segment.analytics.Analytics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AnalyticsServiceImpl extends AnalyticsServiceCEImpl implements AnalyticsService {

    @Autowired
    public AnalyticsServiceImpl(@Autowired(required = false) Analytics analytics,
                                SessionUserService sessionUserService,
                                CommonConfig commonConfig,
                                ConfigService configService,
                                UserUtils userUtils,
                                ProjectProperties projectProperties,
                                UserDataRepository userDataRepository) {
        super(analytics, sessionUserService, commonConfig, configService, userUtils, projectProperties, userDataRepository);
    }

}
