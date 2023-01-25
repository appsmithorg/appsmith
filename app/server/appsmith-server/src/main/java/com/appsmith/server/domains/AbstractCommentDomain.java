package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Transient;

@EqualsAndHashCode(callSuper = true)
@Data
public abstract class AbstractCommentDomain extends BaseDomain {

    @JsonView(Views.Api.class)
    String pageId;

    @JsonView(Views.Api.class)
    String applicationId;

    @JsonView(Views.Api.class)
    String applicationName;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Api.class)
    String authorName;  // Display name of the user, who authored this comment or thread.

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Api.class)
    String authorUsername; // username i.e. email of the user, who authored this comment or thread.

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    @JsonView(Views.Api.class)
    String orgId;

    @JsonView(Views.Api.class)
    String workspaceId;

    /** Edit/Published Mode */
    @JsonView(Views.Api.class)
    ApplicationMode mode;


    @Transient
    @JsonView(Views.Api.class)
    String branchName;

    @JsonView(Views.Api.class)
    public String getType() {
        return getClass().getSimpleName();
    }
}
