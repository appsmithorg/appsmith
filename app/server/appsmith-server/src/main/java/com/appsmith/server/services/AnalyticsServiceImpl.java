package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.services.ce.AnalyticsServiceCEImpl;
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
                                PolicyUtils policyUtils) {

        super(analytics, sessionUserService, commonConfig, configService, policyUtils);
    }
}
