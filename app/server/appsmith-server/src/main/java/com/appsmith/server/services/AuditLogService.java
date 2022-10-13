package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.constants.AuditLogEvents;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.dtos.AuditLogFilterDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface AuditLogService {

    /**
     * To return all the Audit Logs
     * @return List of Audit Logs
     */
    Mono<List<AuditLog>> get(MultiValueMap<String, String> params);

    /**
     * To log the Analytic Event as an Audit Log
     * @param event AnalyticEvent that is being fired
     * @param resource The resource to which event is happening as an Object
     * @param properties Extra properties related to event
     * @return Logged event as an Audit Log
     */
    Mono<AuditLog> logEvent(AnalyticsEvents event, Object resource, Map<String, Object> properties);

    /**
     * Get the filter data for the AuditLog page
     * @return List of all the users in the instance and the eventNames
     */
    Mono<AuditLogFilterDTO> getAuditLogFilterData();

    /**
     * To generate Audit Log supported resourceType
     * @param resource
     * @return String resource type name
     */
    String getResourceType(Object resource);

    Mono<List<String>> getAllUsers();

    /**
     * To get user displayable event name from AuditLogEvents.Events
     *
     * @param eventName AuditLogEvents.Events
     * @return displayable event name
     */
    String getAuditLogEventName(AuditLogEvents.Events eventName);
}
