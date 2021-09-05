package com.appsmith.server.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

// This class will be used for one-to-one mapping for the DB application and the application present in the
// git repo.
@Data
public class GitApplicationMetadata {
    // Git branch corresponding to this application, we have one to one mapping for application in DB with git-branch
    String branchName;

    // Git remote url will be used while pushing and pulling changes
    String remoteUrl;

    // If the current branch is the default one
    Boolean isDefault;

    // Default application id used for storing the application files in local volume :
    // container-volumes/git_repo/organizationId/defaultApplicationId/branchName/applicationDirectoryStructure...
    @JsonIgnore
    String defaultApplicationId;

    // Git credentials used to push changes to remote repo
    GitAuth gitAuth;
}

