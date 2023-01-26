package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

/**
 * This class will be used for connecting resources across branches for git connected application
 * e.g. Page1 in branch1 will have the same defaultResources.pageId as of Page1 of branch2
 */

@Data
public class DefaultResources {
    @JsonView(Views.Public.class)
    String actionId;

    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    String collectionId;

    @JsonView(Views.Public.class)
    String branchName;
}
