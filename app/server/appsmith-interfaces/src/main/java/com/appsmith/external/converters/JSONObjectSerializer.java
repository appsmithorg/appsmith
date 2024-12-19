package com.appsmith.external.converters;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import net.minidev.json.JSONObject;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class JSONObjectSerializer extends StdSerializer<JSONObject> {

    public JSONObjectSerializer(Class<JSONObject> t) {
        super(t);
    }

    public void serialize(JSONObject value, JsonGenerator jsonGenerator, SerializerProvider serializers)
            throws IOException {
        if (value == null) {
            jsonGenerator.writeNull();
        } else {
            jsonGenerator.writeStartObject();
            for (Map.Entry<String, Object> entry : value.entrySet()) {
                String key = entry.getKey();
                Object nestedValue = entry.getValue();

                // Write the field name
                jsonGenerator.writeFieldName(key);

                // Handle different value types
                if (nestedValue instanceof JSONObject) {
                    // Recursively serialize nested JSONObject
                    serialize((JSONObject) nestedValue, jsonGenerator, serializers);
                } else if (nestedValue instanceof List<?>) {
                    // Handle List of values or JSONObjects
                    jsonGenerator.writeStartArray();
                    for (Object item : (List<?>) nestedValue) {
                        if (item instanceof JSONObject) {
                            serialize((JSONObject) item, jsonGenerator, serializers);
                        } else {
                            // Handle values in the array
                            if (item == null) {
                                jsonGenerator.writeNull();
                            } else {
                                jsonGenerator.writeObject(item);
                            }
                        }
                    }
                    jsonGenerator.writeEndArray();
                } else {
                    // Handle simple data types, including null values
                    if (nestedValue == null) {
                        // Explicitly write null value
                        jsonGenerator.writeNull();
                    } else {
                        jsonGenerator.writeObject(nestedValue);
                    }
                }
            }
            jsonGenerator.writeEndObject();
        }
    }
}
