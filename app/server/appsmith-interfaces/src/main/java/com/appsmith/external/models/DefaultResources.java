package com.appsmith.external.models;

import lombok.Data;

/**
 * This class will be used for connecting resources across branches for git connected application
 * e.g. Page1 in branch1 will have the same defaultResources.pageId as of Page1 of branch2
 */

@Data
public class DefaultResources {
    String actionId;

    String applicationId;

    String pageId;

    String collectionId;

    String branchName;
}
