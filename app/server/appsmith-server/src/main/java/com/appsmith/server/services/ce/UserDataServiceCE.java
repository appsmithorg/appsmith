package com.appsmith.server.services.ce;

import com.appsmith.external.enums.WorkspaceResourceContext;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Map;

public interface UserDataServiceCE {

    Mono<UserData> getForUser(User user);

    Mono<UserData> getForUser(String userId);

    Mono<UserData> getForCurrentUser();

    Mono<UserData> getForUserEmail(String email);

    Mono<Map<String, String>> getProfilePhotoAssetIdsForUserIds(Collection<String> userIds);

    Mono<UserData> updateForCurrentUser(UserData updates);

    Mono<UserData> updateForUser(User user, UserData updates);

    Mono<UserData> update(String userId, UserData resource);

    Mono<User> setViewedCurrentVersionReleaseNotes(User user);

    Mono<User> setViewedCurrentVersionReleaseNotes(User user, String version);

    Mono<User> ensureViewedCurrentVersionReleaseNotes(User user);

    Mono<UserData> saveProfilePhoto(Part filePart);

    Mono<Void> deleteProfilePhoto();

    Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange, String email);

    Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange);

    Mono<UserData> updateLastUsedResourceAndWorkspaceList(
            String resourceId, String workspaceId, WorkspaceResourceContext context);

    Mono<Map<String, Boolean>> getFeatureFlagsForCurrentUser();

    Mono<Void> removeRecentWorkspaceAndChildEntities(String userId, String workspaceId);

    Mono<GitProfile> getGitProfileForCurrentUser(String defaultApplicationId);
}
