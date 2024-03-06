package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.dtos.AuditLogFilterDTO;
import com.appsmith.server.dtos.ExportFileDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface AuditLogServiceCECompatible {

    /**
     * To log the Analytic Event as an Audit Log
     * @param event AnalyticEvent that is being fired
     * @param resource The resource to which event is happening as an Object
     * @param properties Extra properties related to event
     * @return Logged event as an Audit Log
     */
    Mono<AuditLog> logEvent(AnalyticsEvents event, Object resource, Map<String, Object> properties);

    /**
     * To return all the Audit Logs
     * @return List of Audit Logs
     */
    Mono<List<AuditLog>> getAuditLogs(MultiValueMap<String, String> params);

    /**
     * Get the filter data for the AuditLog page
     * @return List of all the users in the instance and the eventNames
     */
    Mono<AuditLogFilterDTO> getAuditLogFilterData();

    /**
     * Get Audit Logs exported in a Json File
     * @return ExportFileDTO that contains JSON File as response
     */
    Mono<ExportFileDTO> exportAuditLogs(MultiValueMap<String, String> params);

    Mono<List<String>> getAllUsers();
}
