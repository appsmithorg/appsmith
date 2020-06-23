package com.appsmith.server.controllers;

import com.appsmith.server.domains.User;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
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

    private final ReactiveRedisTemplate<String, String> reactiveTemplate;

    private final ChannelTopic topic;

    @Autowired
    public IndexController(SessionUserService service,
                           ReactiveRedisTemplate<String, String> reactiveTemplate,
                           ChannelTopic topic) {
        this.service = service;
        this.reactiveTemplate = reactiveTemplate;
        this.topic = topic;
    }

    @GetMapping
    public Mono<String> index(Mono<Principal> principal) {
        Mono<User> userMono = service.getCurrentUser();
        return userMono
                .map(obj -> obj.getUsername())
                .map(name -> String.format("Hello %s", name));
    }

    /*
     * This function is primarily for testing if we can publish to Redis successfully. If yes, the response should be
     * non-zero value number of subscribers who've successfully gotten the published message
     */
    @GetMapping("/redisPub")
    public Mono<Long> pubRedisMessage() {
        return reactiveTemplate.convertAndSend(topic.getTopic(), "This is a test message");
    }

}
