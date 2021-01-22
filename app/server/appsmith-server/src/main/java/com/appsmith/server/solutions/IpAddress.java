package com.appsmith.server.solutions;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;

/**
 * This class represents a scheduled task that pings a data point indicating that this server installation is live.
 * This ping is only invoked if the Appsmith server is NOT running in Appsmith Clouud & the user has given Appsmith
 * permissions to collect anonymized data
 */
@Component
@RequiredArgsConstructor
public class IpAddress {

    private static final URI GET_IP_URI = URI.create("https://api64.ipify.org");

    private String cachedAddress = null;

    /**
     * This method hits an API endpoint that returns the external IP address of this server instance.
     *
     * @return A publisher that yields the IP address.
     */
    public Mono<String> get() {
        if (cachedAddress == null) {
            return WebClient
                    .create()
                    .get()
                    .uri(GET_IP_URI)
                    .retrieve()
                    .bodyToMono(String.class)
                    .doOnSuccess(ip -> cachedAddress = ip);
        }

        return Mono.just(cachedAddress);
    }

}
