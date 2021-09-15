package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.CommentBotEvent;
import com.appsmith.server.helpers.CollectionUtils;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

/**
 * This model is intended to hold any user-specific information that is not directly about the user's authentication.
 */
@Getter
@Setter
@ToString
@Document
@NoArgsConstructor
public class UserData extends BaseDomain {

    private static final String DEFAULT_GIT_PROFILE = "default";

    @JsonIgnore
    String userId;

    // Role of the user in their organization, example, Designer, Developer, Product Lead etc.
    private String role;

    // The ID of the asset which has the profile photo of this user.
    private String profilePhotoAssetId;

    // The version where this user has last viewed the release notes.
    private String releaseNotesViewedVersion;

    // list of organisation ids that were recently accessed by the user
    private List<String> recentlyUsedOrgIds;

    // last event triggered by comment bot for this user
    private CommentBotEvent latestCommentEvent;

    // Map of defaultApplicationIds with the GitProfiles. For fallback/default git profile per user we will use default
    // as the key
    @JsonIgnore
    Map<String, GitProfile> gitProfiles;

    public GitProfile getDefaultOrAppSpecificGitProfiles(String defaultApplicationId) {

        if (CollectionUtils.isNullOrEmpty(this.gitProfiles)) {
            return null;
        } else if (!StringUtils.isEmpty(defaultApplicationId) && this.gitProfiles.containsKey(defaultApplicationId)) {
            return this.getGitProfiles().get(defaultApplicationId);
        }
        return this.getGitProfiles().get(DEFAULT_GIT_PROFILE);
    }

    public void setDefaultGitProfile(GitProfile gitProfile){
        if (CollectionUtils.isNullOrEmpty(this.getGitProfiles())) {
            this.setGitProfiles(Map.of(DEFAULT_GIT_PROFILE, gitProfile));
            return;
        }
        this.gitProfiles.put(DEFAULT_GIT_PROFILE, gitProfile);
    }

    public UserData(String userId) {
        this.userId = userId;
    }

}
