package com.appsmith.external.converters;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

import java.lang.reflect.Type;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class ISOStringToInstantConverter implements JsonSerializer<Instant>, JsonDeserializer<Instant> {
    private final DateTimeFormatter formatter =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssX").withZone(ZoneOffset.UTC);

    @Override
    public Instant deserialize(
            JsonElement jsonElement, Type type, JsonDeserializationContext jsonDeserializationContext)
            throws JsonParseException {
        if (jsonElement.isJsonNull()) {
            return null;
        }
        if (jsonElement.isJsonPrimitive()) {
            String jsonString = jsonElement.getAsJsonPrimitive().getAsString();
            if (jsonString.isEmpty()) {
                return null;
            }
            try {
                Double aDouble = Double.parseDouble(jsonString);
                return Instant.ofEpochSecond(aDouble.longValue());
            } catch (NumberFormatException e) {
                // do nothing, let's try to parse with Instant.parse assuming it's in ISO format
            }
        }

        // In other versions of Appsmith, we have observed Instants saved as JSON objects.  E.g.
        //        "deletedAt": {
        //          "nano": 790000000,
        //          "epochSecond": 1641498664
        //        }
        if (jsonElement.isJsonObject()) {
            JsonObject timeObject = jsonElement.getAsJsonObject();
            JsonElement epochSecondElt = timeObject.get("epochSecond");
            JsonElement nanoElt = timeObject.get("nano");
            Long epochSecond = (epochSecondElt != null ? epochSecondElt.getAsLong() : null);
            Long nano = (nanoElt != null ? nanoElt.getAsLong() : null);
            if (epochSecond != null) {
                if (nano != null) {
                    Instant val = Instant.ofEpochSecond(epochSecond, nano);
                    return val;
                } else {
                    Instant val = Instant.ofEpochSecond(epochSecond);
                    return val;
                }
            }
        }

        return Instant.parse(jsonElement.getAsString());
    }

    @Override
    public JsonElement serialize(Instant src, Type typeOfSrc, JsonSerializationContext context) {
        return new JsonPrimitive(formatter.format(src));
    }
}
