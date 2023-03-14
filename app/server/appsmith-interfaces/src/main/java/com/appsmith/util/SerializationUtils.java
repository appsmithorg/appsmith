package com.appsmith.util;

import com.appsmith.external.converters.HttpMethodConverter;
import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.models.DatasourceStructure;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.gson.GsonBuilderCustomizer;
import org.springframework.http.HttpMethod;

import java.time.Instant;

public class SerializationUtils {

    private static final JavaTimeModule JAVA_TIME_MODULE;
    private static final HttpMethodConverter.HttpMethodModule HTTP_METHOD_MODULE;

    static {
        JAVA_TIME_MODULE = new JavaTimeModule();
        HTTP_METHOD_MODULE = new HttpMethodConverter.HttpMethodModule();
    }

    public static ObjectMapper configureObjectMapper(ObjectMapper objectMapper) {
        objectMapper.registerModule(JAVA_TIME_MODULE);
        objectMapper.registerModule(HTTP_METHOD_MODULE);
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        return objectMapper;
    }

    public static ObjectMapper getDefaultObjectMapper() {
        return configureObjectMapper(new ObjectMapper());
    }

    public static GsonBuilderCustomizer typeAdapterRegistration() {
        return builder -> {
            builder.registerTypeAdapter(Instant.class, new ISOStringToInstantConverter());
            builder.registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator());
            builder.registerTypeAdapter(HttpMethod.class, new HttpMethodConverter());
        };
    }
}
