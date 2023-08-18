package com.appsmith.external.converters;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import org.springframework.http.HttpMethod;

import java.io.IOException;
import java.lang.reflect.Type;

public class HttpMethodConverter implements JsonSerializer<HttpMethod>, JsonDeserializer<HttpMethod> {
    @Override
    public HttpMethod deserialize(
            JsonElement jsonElement, Type type, JsonDeserializationContext jsonDeserializationContext)
            throws JsonParseException {
        return HttpMethod.valueOf(jsonElement.getAsString());
    }

    @Override
    public JsonElement serialize(HttpMethod httpMethod, Type type, JsonSerializationContext jsonSerializationContext) {
        return new JsonPrimitive(httpMethod.name());
    }

    public static class HttpMethodModule extends SimpleModule {
        public HttpMethodModule() {
            this.addSerializer(HttpMethod.class, new HttpMethodSerializer());
            this.addDeserializer(HttpMethod.class, new HttpMethodDeserializer());
        }
    }

    public static class HttpMethodSerializer extends com.fasterxml.jackson.databind.JsonSerializer<HttpMethod> {
        @Override
        public void serialize(HttpMethod httpMethod, JsonGenerator jsonGenerator, SerializerProvider serializerProvider)
                throws IOException {
            jsonGenerator.writeString(httpMethod.name());
        }
    }

    public static class HttpMethodDeserializer extends com.fasterxml.jackson.databind.JsonDeserializer<HttpMethod> {

        @Override
        public HttpMethod deserialize(JsonParser jsonParser, DeserializationContext deserializationContext)
                throws IOException {
            return HttpMethod.valueOf(deserializationContext.readValue(jsonParser, String.class));
        }
    }
}
