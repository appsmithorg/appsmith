package com.appsmith.external.models;

import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

@Getter
@Setter
@FieldNameConstants
public abstract class GitSyncedDomain extends BaseDomain {
    // This field will only be used for git related functionality to sync the action object across different instances.
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView({Views.Internal.class, Git.class})
    String gitSyncId;

    public static class Fields extends BaseDomain.Fields {}
}
