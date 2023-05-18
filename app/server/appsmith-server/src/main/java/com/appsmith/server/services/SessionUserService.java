package com.appsmith.server.services;

import com.appsmith.server.services.ce.SessionUserServiceCE;
import org.springframework.security.web.server.WebFilterExchange;
import reactor.core.publisher.Mono;

public interface SessionUserService extends SessionUserServiceCE {

    Mono<Void> logoutExistingSessions(String email, WebFilterExchange exchange);

}
