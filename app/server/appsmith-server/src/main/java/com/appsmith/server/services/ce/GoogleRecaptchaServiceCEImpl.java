package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.CaptchaService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

public class GoogleRecaptchaServiceCEImpl implements CaptchaServiceCE {
    private final WebClient webClient;

    private final GoogleRecaptchaConfig googleRecaptchaConfig;

    private static final String BASE_URL = "https://www.google.com/recaptcha/api/";

    private static final String VERIFY_PATH = "/siteverify";

    private final ObjectMapper objectMapper;

    private static final Long TIMEOUT_IN_MILLIS = 10000L;

    @Autowired
    public GoogleRecaptchaServiceCEImpl(WebClient.Builder webClientBuilder,
                                        GoogleRecaptchaConfig googleRecaptchaConfig,
                                        ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.baseUrl(BASE_URL).build();
        this.googleRecaptchaConfig = googleRecaptchaConfig;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Boolean> verify(String recaptchaResponse) {
        // If secret key is not configured, abort verification.
        if (!StringUtils.hasText(googleRecaptchaConfig.getSecretKey())) {
            return Mono.just(true);
        }

        // API Docs: https://developers.google.com/recaptcha/docs/v3
        return webClient
                .get()
                .uri(uriBuilder -> uriBuilder.path(VERIFY_PATH)
                        .queryParam("response", recaptchaResponse)
                        .queryParam("secret", googleRecaptchaConfig.getSecretKey())
                        .build()
                )
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(stringBody -> {
                    try {
                        Map<String, Object> response = objectMapper.readValue(stringBody, HashMap.class);
                        return Mono.just(response);
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e));
                    }
                })
                .map(mapBody -> (Boolean) mapBody.get("success"))
                .timeout(Duration.ofMillis(TIMEOUT_IN_MILLIS))
                .doOnError(error -> Mono.error(new AppsmithException(AppsmithError.GOOGLE_RECAPTCHA_TIMEOUT)));
    }
}
