package com.appsmith.server.controllers.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.services.SessionUserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import java.security.Principal;

@Slf4j
@AllArgsConstructor
@RequestMapping("")
public class IndexControllerCE {

    private final SessionUserService service;
    private final ReactiveRedisTemplate<String, String> reactiveTemplate;
    private final ChannelTopic topic;

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
