package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.querydsl.core.annotations.QueryEntity;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

import static com.appsmith.server.helpers.DateUtils.ISO_FORMATTER;

@Getter
@Setter
@NoArgsConstructor
@Document
@QueryEntity
public class Workflow extends BranchAwareDomain {

    @NotNull @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView(Views.Public.class)
    String color;

    @JsonView(Views.Public.class)
    String icon;

    @JsonView(Views.Public.class)
    private String slug;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    Instant lastDeployedAt; // when this workflow was last deployed

    @JsonView(Views.Internal.class)
    Instant lastEditedAt;

    @JsonView(Views.Public.class)
    Boolean tokenGenerated = Boolean.FALSE;

    @JsonView(Views.Public.class)
    String mainJsObjectId;

    /**
     * `updatedAt` property is modified by the framework when there is any change in domain,
     * a new property lastEditedAt has been added to track the edit actions from users.
     * This method exposes that property.
     *
     * @return updated time as a string
     */
    @JsonProperty(value = "modifiedAt", access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    public String getLastUpdateTime() {
        if (lastEditedAt != null) {
            return ISO_FORMATTER.format(lastEditedAt);
        }
        return null;
    }

    @JsonView(Views.Public.class)
    public String getLastDeployedAt() {
        if (lastDeployedAt != null) {
            return ISO_FORMATTER.format(lastDeployedAt);
        }
        return null;
    }
}
