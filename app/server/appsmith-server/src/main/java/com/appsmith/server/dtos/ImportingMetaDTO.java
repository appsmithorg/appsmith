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
    /**
     * this represents any parent entity's id which could be imported.
     * e.g. application, packages.
     */
    String contextId;

    String branchName;

    /**
     * this flag is for verifying whether the context in focus needs to be updated with the given provided json
     */
    Boolean appendToContext;
    ImportContextPermissionProvider permissionProvider;
    Set<String> currentUserPermissionGroups;
}
