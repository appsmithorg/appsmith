package com.appsmith.server.domains;

import lombok.Data;

import java.util.Set;

@Data
public class AuditLogUserGroupMetadata {
    Set<String> invitedUsers;
    Set<String> removedUsers;
}
