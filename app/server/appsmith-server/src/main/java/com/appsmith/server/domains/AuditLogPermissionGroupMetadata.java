package com.appsmith.server.domains;

import lombok.Data;

import java.util.List;

@Data
public class AuditLogPermissionGroupMetadata {
    List<String> assignedUsers;
    List<String> unassignedUsers;
    List<String> assignedGroups;
    List<String> unassignedGroups;
}
