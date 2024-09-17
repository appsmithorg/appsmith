package com.appsmith.external.converters;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;

import java.io.IOException;

public class JSONObjectSerializer extends StdSerializer<JSONObject> {

    public JSONObjectSerializer(Class<JSONObject> t) {
        super(t);
    }

    public void serialize(JSONObject value, JsonGenerator jsonGenerator, SerializerProvider serializers)
            throws IOException {
        jsonGenerator.writeStartObject();

        for (String key : value.keySet()) {
            Object obj = value.get(key);
            if (obj == null) {
                jsonGenerator.writeNullField(key);
            } else if (obj instanceof JSONObject) {
                jsonGenerator.writeFieldName(key);
                serialize((JSONObject) obj, jsonGenerator, serializers);
            } else if (obj instanceof JSONArray) {
                jsonGenerator.writeArrayFieldStart(key);
                for (Object element : (JSONArray) obj) {
                    if (element == null) {
                        jsonGenerator.writeNull();
                    } else if (element instanceof JSONObject) {
                        serialize((JSONObject) element, jsonGenerator, serializers);
                    } else {
                        jsonGenerator.writeObject(element);
                    }
                }
                jsonGenerator.writeEndArray();
            } else {
                jsonGenerator.writeObjectField(key, obj); // Preserve original type
            }
        }

        jsonGenerator.writeEndObject();
    }

    /*public void serialize(JSONObject value, JsonGenerator jsonGenerator, SerializerProvider serializers)
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
    }*/
}
