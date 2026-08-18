package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.SessionUserService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import java.security.Principal;

@Slf4j
@AllArgsConstructor
@RequestMapping("")
public class IndexControllerCE {

    private final SessionUserService service;

    @JsonView(Views.Public.class)
    @GetMapping
    public Mono<String> index(Mono<Principal> principal) {
        Mono<User> userMono = service.getCurrentUser();
        return userMono.map(obj -> obj.getUsername()).map(name -> String.format("Hello %s", name));
    }
}
