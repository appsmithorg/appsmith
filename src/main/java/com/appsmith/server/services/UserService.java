package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

public interface UserService extends CrudService<User, String> {

    Mono<User> findByUsername(String name);

    Mono<User> findByEmail(String email);

    Mono<User> save(User newUser);
}
