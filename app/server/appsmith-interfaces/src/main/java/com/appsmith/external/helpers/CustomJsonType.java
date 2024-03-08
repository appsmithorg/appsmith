package com.appsmith.external.helpers;

import com.appsmith.external.views.Views;
import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;

import java.util.TimeZone;

/**
 * Extends the default JsonBinaryType to use a custom ObjectMapper for database serialization.
 * We do it this way, instead of customizing the ObjectMapper in the JsonBinaryType, as described in
 * <a href="https://vladmihalcea.com/hibernate-types-customize-jackson-objectmapper/">this article</a>, because that
 * doesn't work. It apparently works with _some_ versions of Spring / Spring Boot / Spring ORM, but this seemed a simpler
 * solution than hunting down the exact version that works.
 */
public final class CustomJsonType extends JsonBinaryType {
    public CustomJsonType() {
        super(makeObjectMapperForDatabaseSerialization());
    }

    private static ObjectMapper makeObjectMapperForDatabaseSerialization() {
        final ObjectMapper om = new ObjectMapper();

        return SerializationUtils.configureObjectMapper(om)
                .setConfig(om.getSerializationConfig().withView(Views.Internal.class));
    }
}
