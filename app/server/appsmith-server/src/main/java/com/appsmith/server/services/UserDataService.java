package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import reactor.core.publisher.Mono;

public interface UserDataService {
    Mono<UserData> getForUser(User user);

    Mono<UserData> getForUser(String userId);

    Mono<User> setViewedCurrentVersionReleaseNotes(User user);

    Mono<User> setViewedCurrentVersionReleaseNotes(User user, String version);

    Mono<User> ensureViewedCurrentVersionReleaseNotes(User user);
}
