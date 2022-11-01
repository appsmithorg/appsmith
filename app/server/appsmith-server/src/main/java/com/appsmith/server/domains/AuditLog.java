package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Set;

@Data
@ToString
@Document
@NoArgsConstructor
public class AuditLog extends BaseDomain {
    String event;

    Instant timestamp;

    AuditLogApplicationMetadata application;

    AuditLogWorkpsaceMetadata workspace;

    AuditLogMetadata metadata;

    AuditLogResource resource;

    AuditLogUserMetadata user;

    AuditLogPageMetadata page;

    AuditLogAuthenticationMetadata authentication;

    // Invited users list for user.invited event
    ArrayList<String> invitedUsers;

    Set<String> instanceSettings;
}