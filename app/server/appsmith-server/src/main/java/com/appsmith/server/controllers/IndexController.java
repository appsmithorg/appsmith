package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.CommentService;
import com.appsmith.server.services.SessionUserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.security.Principal;

@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("")
public class IndexController {

    private final SessionUserService service;
    private final CommentService commentService;
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

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PostMapping(Url.PUBLIC_COMMENT_URL + "/threads/{threadId}/unsubscribe/{userId}")
    public Mono<ResponseDTO<Boolean>> unsubscribeThread(@PathVariable String userId, @PathVariable String threadId) {
        log.debug("Going to unsubscribe {} from thread {}", userId, threadId);
        return commentService.unsubscribeThread(threadId, userId)
                .map(updated -> new ResponseDTO<>(HttpStatus.NO_CONTENT.value(), updated, null));
    }

}
