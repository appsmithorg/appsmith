package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public interface SessionUserService {
    Mono<User> getCurrentUser();

    Mono<User> refreshCurrentUser(ServerWebExchange exchange);
}
