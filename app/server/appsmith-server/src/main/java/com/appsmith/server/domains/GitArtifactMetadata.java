package com.appsmith.server.domains;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.server.domains.ce.GitArtifactMetadataCE;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldNameConstants;

// This class will be used for one-to-one mapping for the DB application and the application present in the git repo.
@Data
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
public class GitArtifactMetadata extends GitArtifactMetadataCE implements AppsmithDomain {
    public static class Fields extends GitArtifactMetadataCE.Fields {}
}
