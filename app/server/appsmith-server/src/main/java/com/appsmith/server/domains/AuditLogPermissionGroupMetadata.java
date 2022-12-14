package com.appsmith.server.domains;

import lombok.Data;

import java.util.List;

@Data
public class AuditLogPermissionGroupMetadata {
    List<String> assignedUsers;
    List<String> unAssignedUsers;
    List<String> assignedGroups;
    List<String> unAssignedGroups;
}
