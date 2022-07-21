package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.services.ce.AnalyticsServiceCEImpl;
import com.segment.analytics.Analytics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;
@Slf4j
@Service
public class AnalyticsServiceImpl extends AnalyticsServiceCEImpl implements AnalyticsService {
    private final AuditLogService auditLogService;
    @Autowired
    public AnalyticsServiceImpl(@Autowired(required = false) Analytics analytics,
                                SessionUserService sessionUserService,
                                CommonConfig commonConfig,
                                ConfigService configService,
                                PolicyUtils policyUtils,
                                AuditLogService auditLogService) {
        super(analytics, sessionUserService, commonConfig, configService, policyUtils);
        this.auditLogService = auditLogService;
    }

    @Override
    public <T extends BaseDomain> Mono<T> sendObjectEvent(AnalyticsEvents event, T object, Map<String, Object> properties) {
        return auditLogService.logEvent(event, object, properties)
                .flatMap(auditLog -> {
                    return super.sendObjectEvent(event, object, properties);
                });
    }
}
