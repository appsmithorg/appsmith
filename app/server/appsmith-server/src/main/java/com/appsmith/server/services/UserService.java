package com.appsmith.server.services;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.ce_compatible.UserServiceCECompatible;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface UserService extends UserServiceCECompatible {

    Flux<User> findAllByIdsIn(Set<String> ids);

    Flux<User> findAllByUsernameIn(Set<String> usernames);

    Mono<Boolean> makeUserPristineBasedOnLoginSource(LoginSource loginSource, String tenantId);
}
