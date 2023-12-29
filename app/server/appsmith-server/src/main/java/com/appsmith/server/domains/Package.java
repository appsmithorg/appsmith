package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.PackageDTO;
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
public class Package extends BranchAwareDomain {

    // Fields in package that are not allowed to change between published and unpublished versions
    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    String packageUUID; // `packageUUID` is not globally unique but within the workspace

    // `unpublishedPackage` will be empty in case of published version of the package document.
    @JsonView(Views.Internal.class)
    PackageDTO unpublishedPackage;

    // `publishedPackage` will be empty in case of unpublished version aka DEV version of the package document.
    @JsonView(Views.Internal.class)
    PackageDTO publishedPackage;

    // `srcPackageId` will be null for the DEV version; It will contain the `id` of the package that
    // the package editor is working on
    @JsonView(Views.Internal.class)
    String sourcePackageId;

    @JsonView(Views.Internal.class)
    String version;

    @JsonView(Views.Internal.class)
    Instant lastEditedAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Instant lastPublishedAt; // when this package was last published

    @JsonProperty(value = "modifiedAt", access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    public String getLastUpdateTime() {
        if (lastEditedAt == null || lastEditedAt.isBefore(updatedAt)) {
            lastEditedAt = updatedAt;
        }
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
}
