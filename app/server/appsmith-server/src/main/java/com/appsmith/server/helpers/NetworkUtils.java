package com.appsmith.server.helpers;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.util.WebClientUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.net.URI;

@Component
public class NetworkUtils {

    private static final URI GET_IP_URI = URI.create("https://api64.ipify.org");

    private static String cachedAddress = null;

    @Autowired
    public NetworkUtils(@Autowired AirgapInstanceConfig airgapInstanceConfig) {
        if (airgapInstanceConfig.isAirgapEnabled()) {
            cachedAddress = "unknown";
        }
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

       return WebClientUtils
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