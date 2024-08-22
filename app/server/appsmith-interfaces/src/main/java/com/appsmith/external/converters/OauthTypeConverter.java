package com.appsmith.external.converters;

import com.appsmith.external.models.OAuth2;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;

public class OauthTypeConverter {
    public static class OauthTypeSerializer extends com.fasterxml.jackson.databind.JsonSerializer<OAuth2.Type> {
        @Override
        public void serialize(OAuth2.Type type, JsonGenerator jsonGenerator, SerializerProvider serializerProvider)
                throws IOException {
            jsonGenerator.writeString(type.name().toLowerCase());
        }
    }

    public static class OauthTypeDeserializer extends com.fasterxml.jackson.databind.JsonDeserializer<OAuth2.Type> {
        @Override
        public OAuth2.Type deserialize(JsonParser jsonParser, DeserializationContext deserializationContext)
                throws IOException {
            String value = deserializationContext.readValue(jsonParser, String.class);
            if (value == null) {
                return null;
            }
            value = value.toUpperCase();
            return OAuth2.Type.valueOf(value);
        }
    }
}
