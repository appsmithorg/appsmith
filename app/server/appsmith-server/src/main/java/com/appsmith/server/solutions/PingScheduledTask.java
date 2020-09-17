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

import java.net.URI;
import java.util.Map;

/**
 * This class represents a scheduled task that pings a data point indicating that this server installation is live.
 */
@Component
@ConditionalOnProperty(prefix = "is", name = "self-hosted")
@Slf4j
public class PingScheduledTask {

    public static final URI GET_IP_URI = URI.create("https://api6.ipify.org");

    /**
     * Gets the external IP address of this server and pings a data point to indicate that this server instance is live.
     */
    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(fixedRate = 6 * 60 * 60 * 1000 /* six hours */)
    public void pingSchedule() {
        getInstallationId()
                .flatMap(this::doPing)
                .doOnError(error -> log.debug("Error pinging home", error))
                .subscribeOn(Schedulers.single())
                .subscribe();
    }

    /**
     * This method hits an API endpoint that returns the external IP address of this server instance.
     * @return A publisher that yields the IP address.
     */
    private Mono<String> getInstallationId() {
        return WebClient
                .create()
                .get()
                .uri(GET_IP_URI)
                .retrieve()
                .bodyToMono(String.class);
    }

    /**
     * Given a unique ID (called a `userId` here), this method hits the Segment API to save a data point on this server
     * instance being live.
     * @param userId A unique identifier for this server instance (usually, the external IP address of the server).
     * @return A publisher that yields the string response of recording the data point.
     */
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
