package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.helpers.CollectionUtils;
import com.fasterxml.jackson.annotation.JsonView;

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

    @JsonView(Views.Internal.class)
    String userId;

    // Role of the user in their workspace, example, Designer, Developer, Product Lead etc.
    @JsonView(Views.Public.class)
    private String role;

    // The goal the user is trying to solve with Appsmith.
    @JsonView(Views.Public.class)
    private String useCase;

    // The ID of the asset which has the profile photo of this user.
    @JsonView(Views.Public.class)
    private String profilePhotoAssetId;

    // The version where this user has last viewed the release notes.
    @JsonView(Views.Public.class)
    private String releaseNotesViewedVersion;

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    @JsonView(Views.Public.class)
    private List<String> recentlyUsedOrgIds;

    // list of workspace ids that were recently accessed by the user
    @JsonView(Views.Public.class)
    private List<String> recentlyUsedWorkspaceIds;

    // list of application ids that were recently accessed by the user
    @JsonView(Views.Public.class)
    private List<String> recentlyUsedAppIds;


    // Map of defaultApplicationIds with the GitProfiles. For fallback/default git profile per user default will be the
    // the key for the map
    @JsonView(Views.Internal.class)
    Map<String, GitProfile> gitProfiles;

    // JWT tokens
    @JsonView(Views.Internal.class)
    String accessToken;

    @JsonView(Views.Public.class)
    Map<String, Object> userClaims;

    // list of template ids that were recently forked by the user
    @JsonView(Views.Public.class)
    private List<String> recentlyUsedTemplateIds;

    @JsonView(Views.Public.class)
    public GitProfile getGitProfileByKey(String key) {
        // Always use DEFAULT_GIT_PROFILE as fallback
        if (CollectionUtils.isNullOrEmpty(this.getGitProfiles())) {
            return null;
        } else if (!StringUtils.isEmpty(key)) {
            return this.getGitProfiles().get(key);
        }
        return this.getGitProfiles().get(DEFAULT);
    }

    @JsonView(Views.Public.class)
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
