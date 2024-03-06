package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.services.ce.AnalyticsServiceCEImpl;
import com.appsmith.server.solutions.LicenseCacheHelper;
import com.segment.analytics.Analytics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.AnalyticsConstants.LICENSE_ID;

@Slf4j
@Service
public class AnalyticsServiceImpl extends AnalyticsServiceCEImpl implements AnalyticsService {
    private final AuditLogService auditLogService;
    private final LicenseCacheHelper licenseCacheHelper;

    @Autowired
    public AnalyticsServiceImpl(
            @Autowired(required = false) Analytics analytics,
            SessionUserService sessionUserService,
            CommonConfig commonConfig,
            ConfigService configService,
            UserUtils userUtils,
            ProjectProperties projectProperties,
            UserDataRepository userDataRepository,
            AuditLogService auditLogService,
            LicenseCacheHelper licenseCacheHelper) {
        super(
                analytics,
                sessionUserService,
                commonConfig,
                configService,
                userUtils,
                projectProperties,
                userDataRepository);
        this.auditLogService = auditLogService;
        this.licenseCacheHelper = licenseCacheHelper;
    }

    @Override
    public <T> Mono<T> sendObjectEvent(AnalyticsEvents event, T object, Map<String, Object> properties) {

        // Depending on the availability of audit logs support, anticipate the Mono to emit either the actual database
        // object or an empty Mono.
        Mono<AuditLog> auditLogMono = auditLogService.logEvent(event, object, properties);
        // Client generated events need not be sent to analytics
        boolean isClientGeneratedEvent = null != properties
                && properties.containsKey(FieldName.AUDIT_LOGS_ORIGIN)
                && properties.get(FieldName.AUDIT_LOGS_ORIGIN).equals(FieldName.AUDIT_LOGS_ORIGIN_CLIENT);
        if (isClientGeneratedEvent) {
            return auditLogMono.thenReturn(object);
        }
        return auditLogMono.then(super.sendObjectEvent(event, object, properties));
    }

    @Override
    public Mono<Void> sendEvent(String event, String userId, Map<String, ?> properties) {
        // TODO :: using default tenant license, change it once multi-tenancy is introduced
        return licenseCacheHelper.getDefault().flatMap(license -> {
            // casting ? to Object for putting new properties
            Map<String, Object> props = new HashMap<>(properties);
            if (license != null) {
                props.put(LICENSE_ID, license.getId());
            }
            return super.sendEvent(event, userId, props, true);
        });
    }

    /**
     * To get non resource events list
     *
     * @return List of AnanlyticsEvents
     */
    @Override
    public List<AnalyticsEvents> getNonResourceEvents() {
        List<AnalyticsEvents> nonResourceEvents = new ArrayList<>();
        nonResourceEvents.add(AnalyticsEvents.SCIM_DISABLED);
        nonResourceEvents.addAll(super.getNonResourceEvents());

        return nonResourceEvents;
    }
}
