package com.appsmith.external.converters;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

import java.lang.reflect.Type;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class GsonISOStringToInstantConverter implements JsonSerializer<Instant>, JsonDeserializer<Instant> {
    private DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssX").withZone(ZoneOffset.UTC);

    @Override
    public Instant deserialize(JsonElement jsonElement, Type type, JsonDeserializationContext jsonDeserializationContext) throws JsonParseException {
        if(jsonElement.isJsonNull()) {
            return null;
        }
        if (jsonElement.isJsonPrimitive()) {
            String jsonString = jsonElement.getAsJsonPrimitive().getAsString();
            if (jsonString.length() == 0) {
                return null;
            }
            try {
                Double aDouble = Double.parseDouble(jsonString);
                return Instant.ofEpochSecond(aDouble.longValue());
            } catch (NumberFormatException e) {
                // do nothing, let's try to parse with Instant.parse assuming it's in ISO format
            }
        }
        return Instant.parse(jsonElement.getAsString());
    }

    @Override
    public JsonElement serialize(Instant src, Type typeOfSrc, JsonSerializationContext context) {
        return new JsonPrimitive(formatter.format(src));
    }
}
