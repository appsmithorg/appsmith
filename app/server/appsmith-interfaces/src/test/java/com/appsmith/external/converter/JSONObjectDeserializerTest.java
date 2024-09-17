package com.appsmith.external.converter;

import com.appsmith.external.helpers.JsonForDatabase;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

public class JSONObjectDeserializerTest {

    private ObjectMapper getObjectMapper() {
        return JsonForDatabase.create();
    }

    @Test
    void testDeserializeSimpleObject() throws Exception {
        String json = "{\"intField\": 123, \"stringField\": \"test\", \"booleanField\": true, \"doubleField\": 45.67}";

        ObjectMapper objectMapper = getObjectMapper();
        JSONObject result = objectMapper.readValue(json, JSONObject.class);

        assertNotNull(result);
        assertEquals(123, result.getAsNumber("intField"));
        assertEquals("test", result.getAsString("stringField"));
        assertEquals(true, result.get("booleanField"));
        assertEquals(45.67, result.getAsNumber("doubleField"));
    }

    @Test
    void testDeserializeObjectWithNullValue() throws Exception {
        String json = "{\"stringField\": \"test\", \"nullField\": null}";

        ObjectMapper objectMapper = getObjectMapper();
        JSONObject result = objectMapper.readValue(json, JSONObject.class);

        assertNotNull(result);
        assertEquals("test", result.getAsString("stringField"));
        assertNull(result.get("nullField"));
    }

    @Test
    void testDeserializeNestedObject() throws Exception {
        String json = "{\"nestedObject\": {\"innerField\": 42, \"innerString\": \"innerValue\"}}";

        ObjectMapper objectMapper = getObjectMapper();
        JSONObject result = objectMapper.readValue(json, JSONObject.class);

        assertNotNull(result);
        JSONObject nestedObject = (JSONObject) result.get("nestedObject");
        assertNotNull(nestedObject);
        assertEquals(42, nestedObject.getAsNumber("innerField"));
        assertEquals("innerValue", nestedObject.getAsString("innerString"));
    }

    @Test
    void testDeserializeArray() throws Exception {
        String json = "{\"arrayField\": [1, \"two\", true, null]}";

        ObjectMapper objectMapper = getObjectMapper();
        JSONObject result = objectMapper.readValue(json, JSONObject.class);

        assertNotNull(result);
        JSONArray array = (JSONArray) result.get("arrayField");

        assertNotNull(array);
        assertEquals(4, array.size());
        assertEquals(1, array.get(0));
        assertEquals("two", array.get(1));
        assertEquals(true, array.get(2));
        assertNull(array.get(3));
    }

    @Test
    void testDeserializeComplexObject() throws Exception {
        String json = "{\n" + "  \"intField\": 10,\n"
                + "  \"stringField\": \"hello\",\n"
                + "  \"booleanField\": false,\n"
                + "  \"nestedObject\": {\n"
                + "    \"innerInt\": 5,\n"
                + "    \"innerArray\": [1, 2, 3],\n"
                + "    \"innerObject\": {\"innerKey\": \"innerValue\"}\n"
                + "  }\n"
                + "}";

        ObjectMapper objectMapper = getObjectMapper();
        JSONObject result = objectMapper.readValue(json, JSONObject.class);

        assertNotNull(result);
        assertEquals(10, result.getAsNumber("intField"));
        assertEquals("hello", result.getAsString("stringField"));
        assertEquals(false, result.get("booleanField"));

        JSONObject nestedObject = (JSONObject) result.get("nestedObject");
        assertNotNull(nestedObject);
        assertEquals(5, nestedObject.getAsNumber("innerInt"));

        JSONArray innerArray = (JSONArray) nestedObject.get("innerArray");
        assertNotNull(innerArray);
        assertEquals(3, innerArray.size());
        assertEquals(1, innerArray.get(0));
        assertEquals(2, innerArray.get(1));
        assertEquals(3, innerArray.get(2));

        JSONObject innerObject = (JSONObject) nestedObject.get("innerObject");
        assertNotNull(innerObject);
        assertEquals("innerValue", innerObject.getAsString("innerKey"));
    }
}
