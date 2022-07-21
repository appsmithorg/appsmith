package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.AuditLog;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface AuditLogService {

    /**
     * To return all the Audit Logs
     * @return List of Audit Logs
     */
    Mono<List<AuditLog>> get();

    /**
     * To log the Analytic Event as an Audit Log
     * @param event AnalyticEvent that is being fired
     * @param resource The resource to which event is happening as an Object
     * @param properties Extra properties related to event
     * @return Logged event as an Audit Log
     */
    Mono<AuditLog> logEvent(AnalyticsEvents event, Object resource, Map<String, Object> properties);
}
