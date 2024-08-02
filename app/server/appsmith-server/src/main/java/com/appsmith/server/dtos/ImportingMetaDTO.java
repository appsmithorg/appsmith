package com.appsmith.server.dtos;

import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ImportingMetaDTO {
    String workspaceId;
    String artifactType;
    /**
     * this represents any parent entity's id which could be imported.
     * e.g. application, packages, workflows
     */
    String artifactId;

    String branchName;

    List<String> branchedArtifactIds;

    /**
     * this flag is for verifying whether the artifact in focus needs to be updated with the given provided json
     */
    Boolean appendToArtifact;

    Boolean isPartialImport;

    ImportArtifactPermissionProvider permissionProvider;
    Set<String> currentUserPermissionGroups;
}
