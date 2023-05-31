package com.appsmith.server.constants;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.ApplicationMode;
import com.segment.analytics.Analytics;

import java.util.Map;

import static java.util.Map.entry;


import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GITHUB_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_GOOGLE_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_OAUTH2_OIDC_CLIENT_ID;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_SSO_SAML_ENABLED;

public class AuditLogEvents {

    // Valid Events for Audit Logs Filter
    public enum Events {
        WORKSPACE_CREATED,
        WORKSPACE_UPDATED,
        WORKSPACE_DELETED,
        DATASOURCE_CREATED,
        DATASOURCE_UPDATED,
        DATASOURCE_DELETED,
        APPLICATION_CREATED,
        APPLICATION_UPDATED,
        APPLICATION_DELETED,
        APPLICATION_IMPORTED,
        APPLICATION_EXPORTED,
        APPLICATION_FORKED,
        APPLICATION_CLONED,
        APPLICATION_DEPLOYED,
        PAGE_CREATED,
        PAGE_UPDATED,
        PAGE_DELETED,
        PAGE_VIEWED,
        QUERY_CREATED,
        QUERY_UPDATED,
        QUERY_DELETED,
        QUERY_EXECUTED,
        USER_LOGGED_IN,
        USER_LOGGED_OUT,
        USER_SIGNED_UP,
        USER_INVITED,
        USER_DELETED,
        INSTANCE_SETTING_UPDATED,
        GROUP_CREATED,
        GROUP_UPDATED,
        GROUP_DELETED,
        GROUP_INVITE_USERS,
        GROUP_REMOVE_USERS,
        ROLE_CREATED,
        ROLE_UPDATED,
        ROLE_DELETED,
        ROLE_ASSIGNED_GROUPS,
        ROLE_ASSIGNED_USERS,
        ROLE_UNASSIGNED_GROUPS,
        ROLE_UNASSIGNED_USERS
    }

    // Map of AnalyticEvent name with their corresponding Audit Log Action name
    public final static Map<String, String> eventMap = Map.ofEntries(
            entry(AnalyticsEvents.CREATE.getEventName(), FieldName.CREATED),
            entry(AnalyticsEvents.UPDATE.getEventName(), FieldName.UPDATED),
            entry(AnalyticsEvents.DELETE.getEventName(), FieldName.DELETED),
            entry(AnalyticsEvents.EXECUTE_ACTION.getEventName(), FieldName.EXECUTED),
            entry(AnalyticsEvents.CLONE.getEventName(), FieldName.CLONED),
            entry(AnalyticsEvents.FORK.getEventName(), FieldName.FORKED),
            entry(AnalyticsEvents.IMPORT.getEventName(), FieldName.IMPORTED),
            entry(AnalyticsEvents.EXPORT.getEventName(), FieldName.EXPORTED),
            entry(AnalyticsEvents.PUBLISH_APPLICATION.getEventName(), FieldName.DEPLOYED),
            entry(AnalyticsEvents.VIEW.getEventName(), FieldName.VIEWED),
            entry(AnalyticsEvents.LOGIN.getEventName(), FieldName.LOGGED_IN),
            entry(AnalyticsEvents.LOGOUT.getEventName(), FieldName.LOGGED_OUT),
            entry(AnalyticsEvents.FIRST_LOGIN.getEventName(), FieldName.SIGNED_UP),
//            Note: This change signifies that the event Analytics event: `EXECUTE_INVITE_USERS` will not be translated
//            into an action event in the AuditLogs. Hence, this event will not be logged as part of Audit Logs.
//            entry(AnalyticsEvents.EXECUTE_INVITE_USERS.getEventName(), FieldName.INVITED),
            entry(AnalyticsEvents.AUTHENTICATION_METHOD_CONFIGURATION.getEventName(), FieldName.UPDATED),
            entry(AnalyticsEvents.INSTANCE_SETTING_UPDATED.getEventName(), FieldName.UPDATED),
            entry(AnalyticsEvents.INVITE_USERS_TO_USER_GROUPS.getEventName(), FieldName.INVITE_USERS_TO_USER_GROUPS),
            entry(AnalyticsEvents.REMOVE_USERS_FROM_USER_GROUPS.getEventName(), FieldName.REMOVE_USERS_FROM_USER_GROUPS),
            entry(AnalyticsEvents.ASSIGNED_TO_PERMISSION_GROUP.getEventName(), FieldName.ASSIGNED_TO_PERMISSION_GROUPS),
            entry(AnalyticsEvents.UNASSIGNED_FROM_PERMISSION_GROUP.getEventName(), FieldName.UNASSIGNED_FROM_PERMISSION_GROUPS),
            entry(AnalyticsEvents.ASSIGNED_USERS_TO_PERMISSION_GROUP.getEventName(), FieldName.ASSIGNED_USERS_TO_PERMISSION_GROUPS),
            entry(AnalyticsEvents.UNASSIGNED_USERS_FROM_PERMISSION_GROUP.getEventName(), FieldName.UNASSIGNED_USERS_FROM_PERMISSION_GROUPS),
            entry(AnalyticsEvents.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUP.getEventName(), FieldName.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUPS),
            entry(AnalyticsEvents.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUP.getEventName(), FieldName.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUPS)
    );

    // Map of Appsmith resource name with their corresponding Audit Log resource name
    public final static Map<String, String> resourceMap = Map.ofEntries(
            entry(Workspace.class.getSimpleName(), FieldName.WORKSPACE),
            entry(Datasource.class.getSimpleName(), FieldName.DATASOURCE),
            entry(Application.class.getSimpleName(), FieldName.APPLICATION),
            entry(NewPage.class.getSimpleName(), FieldName.PAGE),
            entry(NewAction.class.getSimpleName(), FieldName.QUERY),
            entry(ActionDTO.class.getSimpleName(), FieldName.QUERY),
            entry(User.class.getSimpleName(), FieldName.USER),
            entry(UserGroup.class.getSimpleName(), FieldName.GROUP),
            entry(PermissionGroup.class.getSimpleName(), FieldName.ROLE),
            entry(AnalyticsEvents.AUTHENTICATION_METHOD_CONFIGURATION.getEventName(), FieldName.INSTANCE_SETTING),
            entry(AnalyticsEvents.INSTANCE_SETTING_UPDATED.getEventName(), FieldName.INSTANCE_SETTING)
    );

    public final static Map<String, String> authenticationMethodsMap = Map.ofEntries(
            entry(APPSMITH_OAUTH2_GOOGLE_CLIENT_ID.toString(), FieldName.GOOGLE),
            entry(APPSMITH_OAUTH2_GITHUB_CLIENT_ID.toString(), FieldName.GITHUB),
            entry(APPSMITH_OAUTH2_OIDC_CLIENT_ID.toString(), FieldName.OIDC),
            entry(APPSMITH_SSO_SAML_ENABLED.toString(), FieldName.SAML),
            entry(User.class.getSimpleName(), FieldName.USER)
    );

    // Audit Logs use different naming than the one in ApplicationMode
    public final static Map<String, String> appModeMap = Map.ofEntries(
            entry(ApplicationMode.EDIT.toString(), FieldName.AUDIT_LOG_APP_MODE_EDIT),
            entry(ApplicationMode.PUBLISHED.toString(), FieldName.AUDIT_LOG_APP_MODE_VIEW)
    );

}
