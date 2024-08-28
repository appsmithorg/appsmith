package com.appsmith.server.domains;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ce.GitArtifactMetadataCE;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldNameConstants;

// This class will be used for one-to-one mapping for the DB application and the application present in the git repo.
@Data
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
public class GitArtifactMetadata extends GitArtifactMetadataCE implements AppsmithDomain {

    /**
     * Keeps track of the current migration version of the artifact. If it's less than the latest, then while
     * auto-deployment, a permission migration takes place on artifact and its resources.
     * The value is then changed to latest cdMigrationVersion from JsonSchemaVersions.
     */
    @JsonView(Views.Internal.class)
    Integer cdMigrationVersion;

    /**
     * Boolean flag to store whether auto deployment is enabled for any branch of this application.
     * If true, any branch of this application can be automatically deployed using git web hook.
     */
    @JsonView(Views.Metadata.class)
    boolean isAutoDeploymentEnabled;

    public static class Fields extends GitArtifactMetadataCE.Fields {
    }
}
