package com.appsmith.server.services;

import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.time.Duration;

@Service
public class GoogleRecaptchaServiceImpl implements CaptchaService {
  private final WebClient webClient;

  private final GoogleRecaptchaConfig googleRecaptchaConfig;

  private static String BASE_URL = "https://www.google.com/recaptcha/api/";

  private static String VERIFY_PATH = "/siteverify";

  private final ObjectMapper objectMapper;
  
  private final Long timeoutInMillis = Long.valueOf(10000);

  @Autowired
  public GoogleRecaptchaServiceImpl(WebClient.Builder webClientBuilder,
                                    GoogleRecaptchaConfig googleRecaptchaConfig, ObjectMapper objectMapper) {
      this.webClient = webClientBuilder.baseUrl(BASE_URL).build();
      this.googleRecaptchaConfig = googleRecaptchaConfig;
      this.objectMapper = objectMapper;
  }

  @Override
  public Mono<Boolean> verify(String recaptchaResponse){
    
    // if secret key is not configured, abort verification.
    if (googleRecaptchaConfig.getSecretKey() == "") {
      return Mono.just(true);
    }

    return doVerify(recaptchaResponse).flatMap(mapBody -> {
      return Mono.just((Boolean) mapBody.get("success"));
    });
  }

  // API Docs: https://developers.google.com/recaptcha/docs/v3
  private Mono<Map<String,Object>> doVerify(String recaptchaResponse) {
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
          Map<String,Object> response = objectMapper.readValue(stringBody, HashMap.class);
          return Mono.just(response);
        } catch (JsonProcessingException e) {
          return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e));
        }
      })
      .timeout(Duration.ofMillis(timeoutInMillis))
      .doOnError(error -> Mono.error(new AppsmithException(AppsmithError.GOOGLE_RECAPTCHA_TIMEOUT)));
  }
}
