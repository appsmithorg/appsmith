package com.appsmith.server.dtos;

import com.appsmith.server.helpers.ce.ImportContextPermissionProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ImportingMetaDTO {
    String workspaceId;
    String applicationId;
    String branchName;
    Boolean appendToApp;
    ImportContextPermissionProvider permissionProvider;
    Set<String> currentUserPermissionGroups;
}
