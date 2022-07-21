package com.appsmith.server.configurations;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.codec.HttpMessageReader;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.http.codec.multipart.DefaultPartHttpMessageReader;
import org.springframework.http.codec.multipart.MultipartHttpMessageReader;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class WebConfig implements WebFluxConfigurer {

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        configurer
            .defaultCodecs()
            .configureDefaultCodec(codec -> {
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
