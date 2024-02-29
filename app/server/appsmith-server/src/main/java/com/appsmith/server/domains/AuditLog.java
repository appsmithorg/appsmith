package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Set;

@Data
@ToString
@Document
@NoArgsConstructor
@FieldNameConstants
public class AuditLog extends BaseDomain {
    String event;

    // Origin of Audit Log event to understand whether client generated or server generated
    String origin;

    Instant timestamp;

    AuditLogApplicationMetadata application;

    AuditLogWorkspaceMetadata workspace;

    AuditLogEnvironmentMetadata environment;

    AuditLogDatasourceMetadata datasource;

    AuditLogMetadata metadata;

    AuditLogResource resource;

    AuditLogUserMetadata user;

    AuditLogPageMetadata page;

    AuditLogAuthenticationMetadata authentication;
    AuditLogUserGroupMetadata group;
    AuditLogPermissionGroupMetadata role;
    AuditLogGacMetadata gacMetadata;

    // Invited users list for user.invited event
    ArrayList<String> invitedUsers;

    Set<String> instanceSettings;
    AuditLogLicenseMetadata license;
    AuditLogWorkflowMetadata workflow;

    @Override
    @JsonIgnore
    public boolean isNew() {
        return super.isNew();
    }

    public static class Fields extends BaseDomain.Fields {}
}
