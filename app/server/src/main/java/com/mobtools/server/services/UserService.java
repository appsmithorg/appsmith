package com.mobtools.server.services;

import com.mobtools.server.domains.User;
import reactor.core.publisher.Mono;

public interface UserService extends CrudService<User, String> {

    Mono<User> findByUsername(String name);
}
