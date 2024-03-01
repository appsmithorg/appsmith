package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Package extends BranchAwareDomain implements Artifact {

    // Fields in package that are not allowed to change between published and unpublished versions
    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    String packageUUID; // `packageUUID` is not globally unique but within the workspace

    @JsonView(Views.Public.class)
    Boolean exportWithConfiguration;

    // `unpublishedPackage` will be empty in case of published version of the package document.
    @JsonView(Views.Internal.class)
    PackageDTO unpublishedPackage;

    // `publishedPackage` will be empty in case of unpublished version aka DEV version of the package document.
    @JsonView(Views.Internal.class)
    PackageDTO publishedPackage;

    // `originPackageId` will be null for the DEV version; It will contain the `id` of the package that
    // the package editor is working on
    @JsonView(Views.Internal.class)
    String originPackageId;

    @JsonView(Views.Internal.class)
    String version;

    @JsonView(Views.Internal.class)
    Boolean latest;

    @JsonView(Views.Internal.class)
    Instant lastEditedAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Instant lastPublishedAt; // when this package was last published

    @JsonView(Views.Public.class)
    GitArtifactMetadata gitArtifactMetadata;

    // To convey current schema version for client and server. This will be used to check if we run the migration
    // between 2 commits if the package is connected to git
    @JsonView(Views.Internal.class)
    Integer clientSchemaVersion = JsonSchemaVersions.clientVersion;

    @JsonView(Views.Internal.class)
    Integer serverSchemaVersion = JsonSchemaVersions.serverVersion;

    @JsonProperty(value = "modifiedAt", access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    public String getLastUpdateTime() {
        return (lastEditedAt != null) ? ISO_FORMATTER.format(lastEditedAt) : null;
    }

    @JsonProperty(value = "lastPublished", access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    public String getLastPublishedTime() {
        if (lastPublishedAt != null) {
            return ISO_FORMATTER.format(lastPublishedAt);
        }
        return null;
    }

    @Override
    public String getName() {
        return this.getUnpublishedPackage().getName();
    }

    @Override
    public String getUnpublishedThemeId() {
        return null;
    }

    @Override
    public String getPublishedThemeId() {
        return null;
    }

    @Override
    public void setUnpublishedThemeId(String themeId) {}

    @Override
    public void setPublishedThemeId(String themeId) {}

    @Override
    public void sanitiseToExportDBObject() {
        this.setWorkspaceId(null);
        this.setModifiedBy(null);
        this.setCreatedBy(null);
        this.setLastPublishedAt(null);
        this.setLastEditedAt(null);
        this.setGitArtifactMetadata(null);
        this.setClientSchemaVersion(null);
        this.setServerSchemaVersion(null);
        this.setExportWithConfiguration(null);
        this.setPublishedPackage(null);
        this.getUnpublishedPackage().sanitiseToExportDBObject();
        super.sanitiseToExportDBObject();
    }
}
