package com.appsmith.server.controllers;

import com.appsmith.server.domains.User;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.security.Principal;

@Slf4j
@RestController
@RequestMapping("")
public class IndexController {

    private final SessionUserService service;

    @Autowired
    public IndexController(SessionUserService service) {
        this.service = service;
    }

    @GetMapping
    public Mono<String> index(Mono<Principal> principal) {
        Mono<User> userMono = service.getCurrentUser();
        return principal
                .map(Principal::getName)
                .map(name -> String.format("Hello %s", name));
    }
}
