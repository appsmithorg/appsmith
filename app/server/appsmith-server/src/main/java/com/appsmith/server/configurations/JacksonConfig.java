package com.appsmith.server.configurations;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    /**
     * By default, the objectMapper bean is configured to fail if it tries to serialize an empty bean.
     * We wish to disable this functionality because in multiple places (Eg. EnvManagerCEImpl), the objectMapper
     * can serialize an object that may actually be empty.
     *
     * @return
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        return mapper;
    }
}
