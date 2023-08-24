package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.PackageDTO;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

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
    String name;

    @JsonView(Views.Public.class)
    String color;

    @JsonView(Views.Public.class)
    String icon;

    @JsonView(Views.Public.class)
    PackageDTO unpublishedPackage;

    @JsonView(Views.Public.class)
    PackageDTO publishedPackage;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Instant lastPublishedAt; // when this package was last published
}
