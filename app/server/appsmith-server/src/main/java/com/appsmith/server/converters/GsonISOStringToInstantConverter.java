package com.appsmith.server.converters;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;

import java.lang.reflect.Type;
import java.time.Instant;

public class GsonISOStringToInstantConverter implements JsonDeserializer<Instant> {
    @Override
    public Instant deserialize(JsonElement jsonElement, Type type, JsonDeserializationContext jsonDeserializationContext) throws JsonParseException {
        if(jsonElement.isJsonNull()) {
            return null;
        }
        String jsonString = jsonElement.getAsJsonPrimitive().getAsString();
        if(jsonString.length() == 0) {
            return null;
        }
        try {
            Double aDouble = Double.parseDouble(jsonString);
            return Instant.ofEpochSecond(aDouble.longValue());
        } catch (NumberFormatException e) {
            // do nothing, let's try to parse with Instant.parse assuming it's in ISO format
        }
        return Instant.parse(jsonString);
    }
}
