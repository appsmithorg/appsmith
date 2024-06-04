package com.appsmith.server.helpers.ce;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Slf4j
@RequiredArgsConstructor
public class NetworkUtilsCE {

    private final CloudServicesConfig cloudServicesConfig;

    protected static String cachedAddress = null;

    protected static final String FALLBACK_IP = "unknown";

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
                .uri(cloudServicesConfig.getBaseUrl() + "/api/v1/ip")
                .retrieve()
                .bodyToMono(ResponseDTO.class)
                .map(address -> {
                    cachedAddress = (String) address.getData();
                    return cachedAddress;
                })
                .timeout(Duration.ofSeconds(60))
                .onErrorResume(throwable -> {
                    log.debug("Unable to get the machine ip: ", throwable);
                    return Mono.just(FALLBACK_IP);
                });
    }
}
