package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

/**
 * This class will be used for connecting resources across branches for git connected application
 * e.g. Page1 in branch1 will have the same defaultResources.pageId as of Page1 of branch2
 */

@Data
public class DefaultResources {
    @JsonView(Views.Api.class)
    String actionId;

    @JsonView(Views.Api.class)
    String applicationId;

    @JsonView(Views.Api.class)
    String pageId;

    @JsonView(Views.Api.class)
    String collectionId;

    @JsonView(Views.Api.class)
    String branchName;
}
