package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.constants.CommentOnboardingState;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.FieldName.DEFAULT;

/**
 * This model is intended to hold any user-specific information that is not directly about the user's authentication.
 */
@Getter
@Setter
@ToString
@Document
@NoArgsConstructor
public class UserData extends BaseDomain {

    @JsonIgnore
    String userId;

    // Role of the user in their organization, example, Designer, Developer, Product Lead etc.
    private String role;

    // The goal the user is trying to solve with Appsmith.
    private String useCase;

    // The ID of the asset which has the profile photo of this user.
    private String profilePhotoAssetId;

    // The version where this user has last viewed the release notes.
    private String releaseNotesViewedVersion;

    // list of organisation ids that were recently accessed by the user
    private List<String> recentlyUsedOrgIds;

    // list of application ids that were recently accessed by the user
    private List<String> recentlyUsedAppIds;

    // last state related to comment feature on-boarding
    private CommentOnboardingState commentOnboardingState;

    // Map of defaultApplicationIds with the GitProfiles. For fallback/default git profile per user default will be the
    // the key for the map
    @JsonIgnore
    Map<String, GitProfile> gitProfiles;

    // JWT tokens
    @JsonIgnore
    String accessToken;

    Map<String, Object> userClaims;


    public GitProfile getGitProfileByKey(String key) {
        // Always use DEFAULT_GIT_PROFILE as fallback
        if (CollectionUtils.isNullOrEmpty(this.getGitProfiles())) {
            return null;
        } else if (!StringUtils.isEmpty(key)) {
            return this.getGitProfiles().get(key);
        }
        return this.getGitProfiles().get(DEFAULT);
    }

    public Map<String, GitProfile> setGitProfileByKey(String key, GitProfile gitProfile){
        if (CollectionUtils.isNullOrEmpty(this.getGitProfiles())) {
            return Map.of(key, gitProfile);
        }
        Map<String, GitProfile> updatedGitProfiles = new HashMap<>(this.getGitProfiles());
        updatedGitProfiles.put(key, gitProfile);
        return updatedGitProfiles;
    }

    public UserData(String userId) {
        this.userId = userId;
    }

}
