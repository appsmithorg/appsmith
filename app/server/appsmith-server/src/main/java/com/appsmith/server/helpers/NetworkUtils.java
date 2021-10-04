package com.appsmith.server.helpers;

import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;

public class NetworkUtils {

    private static final URI GET_IP_URI = URI.create("https://api64.ipify.org");

    private static String cachedAddress = null;

    private NetworkUtils() {
    }

    /**
     * This method hits an API endpoint that returns the external IP address of this server instance.
     *
     * @return A publisher that yields the IP address.
     */
    public static Mono<String> getExternalAddress() {
        if (cachedAddress != null) {
            return Mono.just(cachedAddress);
        }

        return WebClient
                .create()
                .get()
                .uri(GET_IP_URI)
                .retrieve()
                .bodyToMono(String.class)
                .map(address -> {
                    cachedAddress = address;
                    return address;
                });
    }

}
