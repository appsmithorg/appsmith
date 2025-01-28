package com.appsmith.server.git.utils;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;

@Slf4j
@Component
@RequiredArgsConstructor
public class GitProfileUtils {

    private final SessionUserService sessionUserService;
    private final UserDataService userDataService;
    private final UserService userService;

    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(
            GitProfile gitProfile, String baseArtifactId) {

        // Throw error in following situations:
        // 1. Updating or creating global git profile (defaultApplicationId = "default") and update is made with empty
        //    authorName or authorEmail
        // 2. Updating or creating repo specific profile and user want to use repo specific profile but provided empty
        //    values for authorName and email

        if ((DEFAULT.equals(baseArtifactId) || Boolean.FALSE.equals(gitProfile.getUseGlobalProfile()))
                && StringUtils.isEmptyOrNull(gitProfile.getAuthorName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Author Name"));
        } else if ((DEFAULT.equals(baseArtifactId) || Boolean.FALSE.equals(gitProfile.getUseGlobalProfile()))
                && StringUtils.isEmptyOrNull(gitProfile.getAuthorEmail())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Author Email"));
        } else if (StringUtils.isEmptyOrNull(baseArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_ID));
        }

        if (DEFAULT.equals(baseArtifactId)) {
            gitProfile.setUseGlobalProfile(null);
        } else if (!Boolean.TRUE.equals(gitProfile.getUseGlobalProfile())) {
            gitProfile.setUseGlobalProfile(Boolean.FALSE);
        }

        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            // GitProfiles will be null if the user has not created any git profile.
                            GitProfile savedProfile = userData.getGitProfileByKey(baseArtifactId);
                            GitProfile defaultGitProfile = userData.getGitProfileByKey(DEFAULT);

                            if (savedProfile == null || !savedProfile.equals(gitProfile) || defaultGitProfile == null) {
                                userData.setGitProfiles(userData.setGitProfileByKey(baseArtifactId, gitProfile));

                                // Assign appsmith user profile as a fallback git profile
                                if (defaultGitProfile == null) {
                                    GitProfile userProfile = new GitProfile();
                                    String authorName = StringUtils.isEmptyOrNull(user.getName())
                                            ? user.getUsername().split("@")[0]
                                            : user.getName();
                                    userProfile.setAuthorEmail(user.getEmail());
                                    userProfile.setAuthorName(authorName);
                                    userProfile.setUseGlobalProfile(null);
                                    userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT, userProfile));
                                }

                                // Update userData here
                                UserData requiredUpdates = new UserData();
                                requiredUpdates.setGitProfiles(userData.getGitProfiles());
                                return userDataService
                                        .updateForUser(user, requiredUpdates)
                                        .map(UserData::getGitProfiles);
                            }
                            return Mono.just(userData.getGitProfiles());
                        })
                        .switchIfEmpty(Mono.defer(() -> {
                            // If profiles are empty use Appsmith's user profile as git default profile
                            GitProfile profile = new GitProfile();
                            String authorName = StringUtils.isEmptyOrNull(user.getName())
                                    ? user.getUsername().split("@")[0]
                                    : user.getName();

                            profile.setAuthorName(authorName);
                            profile.setAuthorEmail(user.getEmail());

                            UserData requiredUpdates = new UserData();
                            requiredUpdates.setGitProfiles(Map.of(DEFAULT, gitProfile));
                            return userDataService
                                    .updateForUser(user, requiredUpdates)
                                    .map(UserData::getGitProfiles);
                        }))
                        .filter(profiles -> !CollectionUtils.isNullOrEmpty(profiles)));
    }

    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile) {
        gitProfile.setUseGlobalProfile(null);
        return updateOrCreateGitProfileForCurrentUser(gitProfile, DEFAULT);
    }

    public Mono<GitProfile> getDefaultGitProfileOrCreateIfEmpty() {
        // Get default git profile if the default is empty then use Appsmith profile as a fallback value
        return getGitProfileForUser(DEFAULT).flatMap(gitProfile -> {
            if (StringUtils.isEmptyOrNull(gitProfile.getAuthorName())
                    || StringUtils.isEmptyOrNull(gitProfile.getAuthorEmail())) {
                return updateGitProfileWithAppsmithProfile(DEFAULT);
            }
            gitProfile.setUseGlobalProfile(null);
            return Mono.just(gitProfile);
        });
    }

    public Mono<GitProfile> getGitProfileForUser(String baseArtifactId) {
        return userDataService.getForCurrentUser().map(userData -> {
            GitProfile gitProfile = userData.getGitProfileByKey(baseArtifactId);
            if (gitProfile != null && gitProfile.getUseGlobalProfile() == null) {
                gitProfile.setUseGlobalProfile(true);
            } else if (gitProfile == null) {
                // If the profile is requested for repo specific using the applicationId
                GitProfile gitProfile1 = new GitProfile();
                gitProfile1.setAuthorName("");
                gitProfile1.setAuthorEmail("");
                gitProfile1.setUseGlobalProfile(true);
                return gitProfile1;
            }
            return gitProfile;
        });
    }

    private Mono<GitProfile> updateGitProfileWithAppsmithProfile(String key) {
        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(currentUser -> {
                    GitProfile gitProfile = new GitProfile();
                    String authorName = StringUtils.isEmptyOrNull(currentUser.getName())
                            ? currentUser.getUsername().split("@")[0]
                            : currentUser.getName();
                    gitProfile.setAuthorEmail(currentUser.getEmail());
                    gitProfile.setAuthorName(authorName);
                    gitProfile.setUseGlobalProfile(null);
                    return userDataService.getForUser(currentUser).flatMap(userData -> {
                        UserData updates = new UserData();
                        if (CollectionUtils.isNullOrEmpty(userData.getGitProfiles())) {
                            updates.setGitProfiles(Map.of(key, gitProfile));
                        } else {
                            userData.getGitProfiles().put(key, gitProfile);
                            updates.setGitProfiles(userData.getGitProfiles());
                        }
                        return userDataService
                                .updateForUser(currentUser, updates)
                                .thenReturn(gitProfile);
                    });
                });
    }
}
