package com.appsmith.util;

import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

public class WebClientUtils {

    private WebClientUtils() {
    }

    public static WebClient create() {
        return builder()
                .build();
    }

    public static WebClient create(String baseUrl) {
        return builder()
                .baseUrl(baseUrl)
                .build();
    }

    private static boolean shouldUseSystemProxy() {
        return "true".equals(System.getProperty("java.net.useSystemProxies"))
                && (!System.getProperty("http.proxyHost", "").isEmpty() || !System.getProperty("https.proxyHost", "").isEmpty());
    }

    public static WebClient.Builder builder() {
        HttpClient httpClient = HttpClient.create();

        if (shouldUseSystemProxy()) {
            httpClient = httpClient.proxyWithSystemProperties();
        }

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient));
    }

}
