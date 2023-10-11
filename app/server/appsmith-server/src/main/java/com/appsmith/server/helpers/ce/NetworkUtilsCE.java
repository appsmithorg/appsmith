package com.appsmith.server.helpers.ce;

import com.appsmith.util.WebClientUtils;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Duration;

@Slf4j
public class NetworkUtilsCE {

    private static final URI GET_IP_URI = URI.create("https://api64.ipify.org");

    protected static String cachedAddress = null;

    protected static final String FALLBACK_IP = "unknown";

    protected NetworkUtilsCE() {}

    /**
     * This method hits an API endpoint that returns the external IP address of this server instance.
     *
     * @return A publisher that yields the IP address.
     */
    public Mono<String> getExternalAddress() {
        if (cachedAddress != null) {
            return Mono.just(cachedAddress);
        }

        return WebClientUtils.create()
                .get()
                .uri(GET_IP_URI)
                .retrieve()
                .bodyToMono(String.class)
                .map(address -> {
                    cachedAddress = address;
                    return address;
                })
                .timeout(Duration.ofSeconds(60))
                .onErrorResume(throwable -> {
                    log.debug("Unable to get the machine ip: ", throwable);
                    return Mono.just(FALLBACK_IP);
                });
    }
}
