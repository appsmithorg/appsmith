package com.appsmith.server.solutions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;

@Component
@ConditionalOnProperty(prefix = "is", name = "self-hosted")
@Slf4j
public class ScheduledTasks {

    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(fixedRate = 6 * 60 * 60 * 1000)
    public void pingSchedule() {
        getInstallationId()
                // .doOnSuccess(content -> log.debug("installation id {}", content))
                .flatMap(this::doPing)
                // .doOnSuccess(content -> log.debug("ping response {}", content))
                .doOnError(error -> log.debug("Error pinging home", error))
                .subscribeOn(Schedulers.single())
                .subscribe();
    }

    private Mono<String> getInstallationId() {
        return WebClient
                .create("https://api6.ipify.org")
                .get()
                .uri("")
                .retrieve()
                .bodyToMono(String.class);
    }

    private Mono<String> doPing(String userId) {
        // Note: Hard-coding Segment auth header and the event name intentionally. These are not intended to be
        // environment specific values, instead, they are common values for all self-hosted environments. As such, they
        // are not intended to be configurable.
        return WebClient
                .create("https://api.segment.io")
                .post()
                .uri("/v1/track")
                .header("Authorization", "Basic QjJaM3hXRThXdDRwYnZOWDRORnJPNWZ3VXdnYWtFbk06")
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(Map.of(
                        "userId", userId,
                        "event", "Instance Active"
                )))
                .retrieve()
                .bodyToMono(String.class);
    }

}
