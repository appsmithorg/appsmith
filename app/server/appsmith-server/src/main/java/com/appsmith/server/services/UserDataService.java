package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public interface UserDataService {
    Mono<UserData> getForUser(User user);

    Mono<UserData> getForUser(String userId);

    Mono<UserData> getForCurrentUser();

    Mono<UserData> getForUserEmail(String email);

    Mono<UserData> updateForCurrentUser(UserData updates);

    Mono<User> setViewedCurrentVersionReleaseNotes(User user);

    Mono<User> setViewedCurrentVersionReleaseNotes(User user, String version);

    Mono<User> ensureViewedCurrentVersionReleaseNotes(User user);

    Mono<UserData> saveProfilePhoto(Part filePart);

    Mono<Void> deleteProfilePhoto();

    Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange, String email);

    Mono<Void> makeProfilePhotoResponse(ServerWebExchange exchange);

}
