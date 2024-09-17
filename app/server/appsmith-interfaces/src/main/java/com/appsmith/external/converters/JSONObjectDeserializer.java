package com.appsmith.external.converters;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

public class JSONObjectDeserializer extends StdDeserializer<JSONObject> {

    public JSONObjectDeserializer(Class<JSONObject> t) {
        super(t);
    }

    public JSONObject deserialize(JsonParser jsonParser, DeserializationContext context)
            throws IOException, JsonProcessingException {
        // Use Jackson to read a generic Object and then handle type casting appropriately
        /*Object parsed = jsonParser.readValueAs(Object.class);
        return handleParsedObject(parsed);*/
        ObjectCodec codec = jsonParser.getCodec();
        JsonNode node = codec.readTree(jsonParser);

        // Convert JsonNode to LinkedHashMap to avoid the cast exception
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> map = mapper.convertValue(node, LinkedHashMap.class);

        // Return the map wrapped in a JSONObject
        return new JSONObject(map);
    }

    private JSONObject handleParsedObject(Object parsed) {
        if (parsed instanceof Map) {
            return convertMapToJSONObject((Map<String, Object>) parsed); // Handle objects
        } else if (parsed instanceof JSONArray) {
            throw new IllegalStateException("Expected JSONObject but found JSONArray");
        } else {
            throw new IllegalStateException("Unexpected JSON structure");
        }
    }

    private JSONObject convertMapToJSONObject(Map<String, Object> map) {
        JSONObject jsonObject = new JSONObject();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            Object value = entry.getValue();

            if (value instanceof Map) {
                value = convertMapToJSONObject((Map<String, Object>) value); // Handle nested objects
            } else if (value instanceof Iterable) {
                value = convertIterableToJSONArray((Iterable<?>) value); // Handle arrays
            }
            // No need to cast anything further here, we preserve original types
            jsonObject.put(entry.getKey(), value);
        }
        return jsonObject;
    }

    private JSONArray convertIterableToJSONArray(Iterable<?> iterable) {
        JSONArray jsonArray = new JSONArray();
        for (Object element : iterable) {
            if (element instanceof Map) {
                element = convertMapToJSONObject((Map<String, Object>) element); // Handle nested objects in arrays
            }
            jsonArray.add(element); // Preserve original element type
        }
        return jsonArray;
    }

    /*public JSONObject deserialize(JsonParser jsonParser, DeserializationContext deserializationContext)
            throws IOException, JsonProcessingException {
        JsonNode node = jsonParser.getCodec().readTree(jsonParser);
        return processJsonNode(node);
    }

    private JSONObject processJsonNode(JsonNode node) {
        JSONObject jsonObject = new JSONObject();

        // Iterate over the fields in the JSON object
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            String fieldName = field.getKey();
            JsonNode fieldValue = field.getValue();

            // Handle the different types of values
            if (fieldValue.isObject()) {
                // Recursively process nested JSONObject
                jsonObject.put(fieldName, processJsonNode(fieldValue));
            } else if (fieldValue.isArray()) {
                // Process arrays
                jsonObject.put(fieldName, processJsonArray(fieldValue));
            } else if (fieldValue.isNull()) {
                // Handle null values explicitly
                jsonObject.put(fieldName, null);
            } else {
                // Handle primitive types (string, number, boolean)
                jsonObject.put(fieldName, getPrimitiveValue(fieldValue));
            }
        }
        return jsonObject;
    }

    private Object processJsonArray(JsonNode arrayNode) {
        JSONArray jsonArray = new JSONArray();
        for (JsonNode element : arrayNode) {
            if (element.isObject()) {
                // Recursively process nested objects in arrays
                jsonArray.add(processJsonNode(element));
            } else if (element.isArray()) {
                // Recursively process nested arrays
                jsonArray.add(processJsonArray(element));
            } else if (element.isNull()) {
                // Add null values to the array
                jsonArray.add(null);
            } else {
                // Handle primitive types in arrays
                jsonArray.add(getPrimitiveValue(element));
            }
        }
        return jsonArray;
    }

    // Determine the appropriate type of the primitive value and return it
    private Object getPrimitiveValue(JsonNode node) {
        if (node.isInt()) {
            return node.asInt();
        } else if (node.isLong()) {
            return node.asLong();
        } else if (node.isDouble()) {
            return node.asDouble();
        } else if (node.isBoolean()) {
            return node.asBoolean();
        } else {
            // For other cases (like strings or non-standard types), we fallback to asText()
            return node.asText();
        }
    }*/
}
