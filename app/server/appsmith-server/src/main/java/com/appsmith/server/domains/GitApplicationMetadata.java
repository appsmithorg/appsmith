package com.appsmith.server.domains;

import com.appsmith.external.models.AppsmithDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import org.springframework.data.annotation.Transient;
import java.util.Map;

// This class will be used for one-to-one mapping for the DB application and the application present in the git repo.
@Data
public class GitApplicationMetadata implements AppsmithDomain {
    // Git branch corresponding to this application, we have one to one mapping for application in DB with git-branch
    String branchName;

    // Git default branch corresponding to the remote git repo to which the application is connected to
    String defaultBranchName;

    // Git remote url will be used while pushing and pulling changes
    String remoteUrl;

    // Git remote https url will be used while checking if the repo is public or private
    String browserSupportedRemoteUrl;

    // If remote repo is private and will be stored only with default application
    Boolean isRepoPrivate;

    // The name of git repo
    String repoName;

    // Default application id used for storing the application files in local volume :
    // container-volumes/git_repo/organizationId/defaultApplicationId/branchName/applicationDirectoryStructure...
    String defaultApplicationId;

    // Git credentials used to push changes to remote repo and will be stored with default application only to optimise
    // space requirement and update operation
    @JsonIgnore
    GitAuth gitAuth;

    @Transient
    Map<String, GitProfile> gitProfiles;

    @Transient
    String publicKey;

    // Deploy key documentation url
    @Transient
    String docUrl;
}
