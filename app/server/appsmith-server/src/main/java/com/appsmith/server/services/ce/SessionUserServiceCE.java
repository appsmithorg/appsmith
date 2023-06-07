/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;

import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

import java.util.List;

public interface SessionUserServiceCE {

    Mono<User> getCurrentUser();

    Mono<User> refreshCurrentUser(ServerWebExchange exchange);

    Mono<Void> logoutAllSessions(String email);

    Mono<List<String>> getSessionKeysByUserEmail(String email);

    Mono<Long> deleteSessionsByKeys(List<String> keys);
}
