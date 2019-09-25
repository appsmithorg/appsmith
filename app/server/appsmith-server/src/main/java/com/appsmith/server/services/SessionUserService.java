package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

public interface SessionUserService {
    public Mono<User> getCurrentUser();
}
