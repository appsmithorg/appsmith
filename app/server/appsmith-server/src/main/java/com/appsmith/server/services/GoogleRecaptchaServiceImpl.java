package com.appsmith.server.services;

import com.appsmith.server.configurations.GoogleRecaptchaConfig;
import com.appsmith.server.services.ce.GoogleRecaptchaServiceCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class GoogleRecaptchaServiceImpl extends GoogleRecaptchaServiceCEImpl implements CaptchaService {

    public GoogleRecaptchaServiceImpl(WebClient.Builder webClientBuilder,
                                      GoogleRecaptchaConfig googleRecaptchaConfig,
                                      ObjectMapper objectMapper) {

        super(webClientBuilder, googleRecaptchaConfig, objectMapper);
    }
}
