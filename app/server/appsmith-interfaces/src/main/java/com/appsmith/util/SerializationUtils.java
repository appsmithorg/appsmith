package com.appsmith.util;

import com.appsmith.external.converters.HttpMethodConverter;
import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.PrettyPrinter;
import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.cfg.JsonNodeFeature;
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
        return objectMapper
                .findAndRegisterModules()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false)
                .enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature())
                .registerModules(JAVA_TIME_MODULE, HTTP_METHOD_MODULE)
                .setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    public static ObjectMapper getBasicObjectMapper(PrettyPrinter prettyPrinter) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false)
                .enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature())
                .registerModules(JAVA_TIME_MODULE, HTTP_METHOD_MODULE)
                .setSerializationInclusion(JsonInclude.Include.NON_NULL);

        if (prettyPrinter != null) {
            objectMapper
                    .setDefaultPrettyPrinter(prettyPrinter)
                    .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true)
                    .configure(JsonNodeFeature.WRITE_PROPERTIES_SORTED, true)
                    .configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true)
                    .enable(SerializationFeature.INDENT_OUTPUT);
        }

        return objectMapper;
    }

    public static ObjectMapper getDefaultObjectMapper(PrettyPrinter prettyPrinter) {
        ObjectMapper objectMapper = getBasicObjectMapper(prettyPrinter);

        /*
         Setting Views.Public as default view class for the serializer.
         Views.Public.class will be used if a controller has no JsonView annotation present.
         It'll be overridden by the JsonView annotation in the controller.
        */
        objectMapper.setConfig(objectMapper.getSerializationConfig().withView(Views.Public.class));

        return objectMapper;
    }

    public static GsonBuilderCustomizer typeAdapterRegistration() {
        return builder -> {
            builder.registerTypeAdapter(Instant.class, new ISOStringToInstantConverter());
            builder.registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator());
            builder.registerTypeAdapter(HttpMethod.class, new HttpMethodConverter());
        };
    }

    public static ObjectMapper getObjectMapperWithSourceInLocationEnabled() {
        return new ObjectMapper().enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature());
    }

    public static ObjectMapper getObjectMapperWithSourceInLocationAndMaxStringLengthEnabled() {
        ObjectMapper objectMapper =
                new ObjectMapper().enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature());
        // Multipart data would be parsed using object mapper, these files may be large in the size.
        // Hence, the length should not be truncated, therefore allowing maximum length.
        objectMapper
                .getFactory()
                .setStreamReadConstraints(StreamReadConstraints.builder()
                        .maxStringLength(Integer.MAX_VALUE)
                        .build());

        return objectMapper;
    }
}
