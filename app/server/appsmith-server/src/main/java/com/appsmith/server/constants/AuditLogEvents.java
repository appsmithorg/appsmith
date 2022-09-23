package com.appsmith.server.constants;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;

import java.util.Map;

import static java.util.Map.entry;

public class AuditLogEvents {

    // Map of AnalyticEvent name with their corresponding Audit Log Action name
    public final static Map<String, String> eventMap = Map.ofEntries(
            entry(AnalyticsEvents.CREATE.getEventName(), FieldName.CREATED),
            entry(AnalyticsEvents.UPDATE.getEventName(), FieldName.UPDATED),
            entry(AnalyticsEvents.DELETE.getEventName(), FieldName.DESTROYED)
    );

    // Map of Appsmith resource name with their corresponding Audit Log resource name
    public final static Map<String, String> resourceMap = Map.ofEntries(
            entry(Workspace.class.getSimpleName(), FieldName.WORKSPACE),
            entry(Datasource.class.getSimpleName(), FieldName.DATASOURCE),
            entry(Application.class.getSimpleName(), FieldName.APPLICATION),
            entry(NewPage.class.getSimpleName(), FieldName.PAGE),
            entry(NewAction.class.getSimpleName(), FieldName.QUERY)
    );
}
