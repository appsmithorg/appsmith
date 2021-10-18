package com.appsmith.server.domains;

import lombok.Data;

/**
 * This class will be used for connecting resources across branches for git connected application
 * e.g. Page1 in branch1 will have the same defaultApplicationId as of Page1 of branch2
 */

@Data
public class DefaultResources {
    String defaultActionId;

    String defaultApplicationId;

    String defaultPageId;

    String defaultActionCollectionId;

    String branchName;
}
