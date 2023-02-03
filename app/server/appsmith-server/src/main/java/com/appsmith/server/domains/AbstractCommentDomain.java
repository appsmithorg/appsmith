package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Transient;

@EqualsAndHashCode(callSuper = true)
@Data
public abstract class AbstractCommentDomain extends BaseDomain {

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    String applicationName;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    String authorName;  // Display name of the user, who authored this comment or thread.

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(Views.Public.class)
    String authorUsername; // username i.e. email of the user, who authored this comment or thread.

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    String orgId;

    @JsonView(Views.Public.class)
    String workspaceId;

    /** Edit/Published Mode */
    @JsonView(Views.Public.class)
    ApplicationMode mode;


    @Transient
    @JsonView(Views.Public.class)
    String branchName;

    @JsonView(Views.Public.class)
    public String getType() {
        return getClass().getSimpleName();
    }
}
