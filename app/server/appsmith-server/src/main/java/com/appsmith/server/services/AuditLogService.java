package com.appsmith.server.services;

import com.appsmith.server.constants.AuditLogEvents;
import com.appsmith.server.services.ce_compatible.AuditLogServiceCECompatible;

public interface AuditLogService extends AuditLogServiceCECompatible {

    /**
     * To generate Audit Log supported resourceType
     * @param resource
     * @return String resource type name
     */
    String getResourceType(Object resource);

    /**
     * To get user displayable event name from AuditLogEvents.Events
     *
     * @param eventName AuditLogEvents.Events
     * @return displayable event name
     */
    String getAuditLogEventName(AuditLogEvents.Events eventName);
}
