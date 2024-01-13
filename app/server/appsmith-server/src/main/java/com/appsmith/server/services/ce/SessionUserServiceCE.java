package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;

public interface SessionUserServiceCE {

    Mono<User> getCurrentUser();

    Mono<User> refreshCurrentUser(ServerWebExchange exchange);

    Mono<Void> logoutAllSessions(String email);

    Mono<List<String>> getSessionKeysByUserEmail(String email);

    Mono<Long> deleteSessionsByKeys(List<String> keys);

    Flux<Tuple2<String, User>> getSessionKeysWithUserSessions();
}
