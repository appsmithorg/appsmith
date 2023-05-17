package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.services.ce.AnalyticsServiceCEImpl;
import com.segment.analytics.Analytics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
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
                                UserUtils userUtils,
                                ProjectProperties projectProperties,
                                UserDataRepository userDataRepository,
                                AuditLogService auditLogService) {
        super(analytics, sessionUserService, commonConfig, configService, userUtils, projectProperties, userDataRepository);
        this.auditLogService = auditLogService;
    }

    @Override
    public <T extends BaseDomain> Mono<T> sendObjectEvent(AnalyticsEvents event, T object, Map<String, Object> properties) {
        return auditLogService.logEvent(event, object, properties)
                .flatMap(auditLog -> {
                    // Client generated events need not be sent to analytics
                    Boolean isClientGeneratedEvent = null != properties && properties.containsKey(FieldName.AUDIT_LOGS_ORIGIN) && properties.get(FieldName.AUDIT_LOGS_ORIGIN).equals(FieldName.AUDIT_LOGS_ORIGIN_CLIENT);
                    if (isClientGeneratedEvent) {
                        return Mono.just(object);
                    }
                    return super.sendObjectEvent(event, object, properties);
                });
    }

    /**
     * To get non resource events list
     * @return List of AnanlyticsEvents
     */
    @Override
    public List<AnalyticsEvents> getNonResourceEvents() {
        List<AnalyticsEvents> nonResourceEvents = new ArrayList<>();
        nonResourceEvents.addAll(List.of(
                AnalyticsEvents.ACTIVATE_NEW_INSTANCE,
                AnalyticsEvents.UPDATE_EXISTING_LICENSE
        ));
        nonResourceEvents.addAll(super.getNonResourceEvents());

        return nonResourceEvents;
    }

}
