package com.appsmith.server.git.dtos;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.ce.RefType;
import lombok.Data;

// TODO: Find a better name for this DTO

/**
 * This DTO carries the info when a json is getting transformed in a git resource map or vice versa,
 * this is also responsible for traversing paths for fs ops
 */
@Data
public class ArtifactJsonTransformationDTO {

    String workspaceId;

    String baseArtifactId;

    String repoName;

    String refName;

    ArtifactType artifactType;

    RefType refType;
}
