package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;

import java.util.Set;

import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public interface SessionUserServiceCE {

    Mono<User> getCurrentUser();

    Mono<Set<String>> getCurrentPermissionGroups();

    Mono<User> refreshCurrentUser(ServerWebExchange exchange);

    Mono<Void> logoutAllSessions(String email);
}
