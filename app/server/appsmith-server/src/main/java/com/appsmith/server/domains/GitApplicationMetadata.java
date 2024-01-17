package com.appsmith.server.domains;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ce.AutoDeployment;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

// This class will be used for one-to-one mapping for the DB application and the application present in the git repo.
@Data
public class GitApplicationMetadata implements AppsmithDomain {
    // Git branch corresponding to this application, we have one to one mapping for application in DB with git-branch
    @JsonView(Views.Public.class)
    String branchName;

    // Git default branch corresponding to the remote git repo to which the application is connected to
    @JsonView(Views.Public.class)
    String defaultBranchName;

    // Git remote url will be used while pushing and pulling changes
    @JsonView(Views.Public.class)
    String remoteUrl;

    // Git remote https url will be used while checking if the repo is public or private
    @JsonView(Views.Public.class)
    String browserSupportedRemoteUrl;

    // If remote repo is private and will be stored only with default application
    @JsonView(Views.Public.class)
    Boolean isRepoPrivate;

    // The name of git repo
    @JsonView(Views.Public.class)
    String repoName;

    // Default application id used for storing the application files in local volume :
    // container-volumes/git_repo/workspaceId/defaultApplicationId/branchName/applicationDirectoryStructure...
    @JsonView(Views.Public.class)
    String defaultApplicationId;

    // Git credentials used to push changes to remote repo and will be stored with default application only to optimise
    // space requirement and update operation
    @JsonView(Views.Internal.class)
    GitAuth gitAuth;

    @Transient
    @JsonView(Views.Public.class)
    Map<String, GitProfile> gitProfiles;

    @Transient
    @JsonView(Views.Public.class)
    String publicKey;

    // Deploy key documentation url
    @Transient
    @JsonView(Views.Public.class)
    String docUrl;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssX", timezone = "UTC")
    @JsonView(Views.Public.class)
    Instant lastCommittedAt;

    @JsonView(Views.Metadata.class)
    List<String> branchProtectionRules;

    /**
     * This field is no more used and will be removed in future version.
     * Please use the branchProtectionRules field to know whether a branch is protected or not.
     */
    @Deprecated
    @JsonView(Views.Internal.class)
    Boolean isProtectedBranch;

    @JsonView(Views.Metadata.class)
    AutoCommitConfig autoCommitConfig;

    /**
     * autoDeploymentConfigs field will hold the list of branches that are enabled for auto deployment.
     * It'll also show the latest deployedAt date for the corresponding branch.
     * If auto deployment is enabled for 2 branches - main and develop, autoDeploymentConfigs will have two entries
     * each for one branch. This attribute will be present inside the root application only. The branched applications
     * will not have this field set.
     */
    @JsonView(Views.Metadata.class)
    Set<AutoDeployment> autoDeploymentConfigs;

    public AutoCommitConfig getAutoCommitConfig() {
        // by default, the auto commit should be enabled.
        // new AutoCommitConfig will have enabled=true so we're returning a new object when field is null
        if (autoCommitConfig == null) {
            autoCommitConfig = new AutoCommitConfig();
        }
        return autoCommitConfig;
    }
}
