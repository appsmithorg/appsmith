package com.appsmith.external.models;

import lombok.Data;

/**
 * This class will be used for connecting resources across branches for git connected application
 * e.g. Page1 in branch1 will have the same defaultResources.pageId as of Page1 of branch2
 */
@Data
public class DefaultResources {
    /**
     * When present, actionId will hold the default action id
     */
    String actionId;

    /**
     * When present, applicationId will hold the default application id
     */
    String applicationId;

    /**
     * When present, pageId will hold the default page id
     */
    String pageId;

    /**
     * When present, collectionId will hold the default collection id
     */
    String collectionId;

    /**
     * When present, branchName will hold the current branch name.
     * For example, if we've a page in both main and develop branch, then default resources of those two pages will
     * have same applicationId, pageId but branchName will contain the corresponding branch name.
     */
    String branchName;
}
