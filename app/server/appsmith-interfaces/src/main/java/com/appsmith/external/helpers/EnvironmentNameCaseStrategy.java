package com.appsmith.external.helpers;

import com.appsmith.external.constants.CommonFieldName;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;

import static org.springframework.util.StringUtils.hasText;

public class EnvironmentNameCaseStrategy {
    public static class SelectiveLowerCaseNamingStrategy extends JsonDeserializer<String> {

        public String deserialize(JsonParser jsonParser, DeserializationContext deserializationContext)
                throws IOException {

            String propertyName = jsonParser.getValueAsString("name");
            if (!hasText(propertyName)) {
                return propertyName;
            }

            if (CommonFieldName.PRODUCTION_ENVIRONMENT.matches(propertyName.toLowerCase())
                    || CommonFieldName.STAGING_ENVIRONMENT.matches(propertyName.toLowerCase())) {
                // make it small the first letter of the field name
                return propertyName.toLowerCase();
            }

            return propertyName;
        }
    }

    public static class PascalCaseNamingStrategy extends JsonSerializer<String> {
        @Override
        public void serialize(String propertyName, JsonGenerator jsonGenerator, SerializerProvider serializerProvider)
                throws IOException {

            if (!hasText(propertyName)) {
                jsonGenerator.writeString(propertyName);
            }

            if (CommonFieldName.PRODUCTION_ENVIRONMENT.matches(propertyName)
                    || CommonFieldName.STAGING_ENVIRONMENT.matches(propertyName)) {
                // Capitalize the first letter of the field name
                jsonGenerator.writeString(Character.toUpperCase(propertyName.charAt(0)) + propertyName.substring(1));
            } else {
                jsonGenerator.writeString(propertyName);
            }
        }
    }
}
