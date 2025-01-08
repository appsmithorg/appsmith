package com.appsmith.server.git.dtos;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.constants.ArtifactType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// TODO: Find a better name for this DTO

/**
 * This DTO carries the info when a json is getting transformed in a git resource map or vice versa,
 * this is also responsible for traversing paths for fs ops
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArtifactJsonTransformationDTO {

    String workspaceId;

    String baseArtifactId;

    String repoName;

    String refName;

    ArtifactType artifactType;

    RefType refType;

    public ArtifactJsonTransformationDTO(String workspaceId, String baseArtifactId, String repoName) {
        this.workspaceId = workspaceId;
        this.baseArtifactId = baseArtifactId;
        this.repoName = repoName;
    }
}
