package com.appsmith.server.configurations;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.HttpMessageReader;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.http.codec.multipart.DefaultPartHttpMessageReader;
import org.springframework.http.codec.multipart.MultipartHttpMessageReader;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class WebConfig implements WebFluxConfigurer {

    private final ObjectMapper objectMapper;

    public WebConfig(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    @SuppressWarnings("removal")
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        // Build the JSON codecs from our ObjectMapper explicitly. It carries the Views.Public default view and the
        // NON_NULL inclusion that every API response depends on, so the codecs must not depend on which Jackson
        // mapper Spring Boot 4 auto-configures.
        configurer.defaultCodecs().jacksonJsonEncoder(new Jackson2JsonEncoder(objectMapper));
        configurer.defaultCodecs().jacksonJsonDecoder(new Jackson2JsonDecoder(objectMapper));

        configurer.defaultCodecs().configureDefaultCodec(codec -> {
            if (codec instanceof MultipartHttpMessageReader) {
                HttpMessageReader<Part> partReader = ((MultipartHttpMessageReader) codec).getPartReader();
                if (partReader instanceof DefaultPartHttpMessageReader) {
                    // Set max file part header size to 128kB
                    ((DefaultPartHttpMessageReader) partReader).setMaxHeadersSize(128 * 1024);
                }
            }
        });
    }
}
