package com.appsmith.external.converter;

import com.appsmith.external.helpers.JsonForDatabase;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class JSONObjectSerializerTest {
    private ObjectMapper getObjectMapper() {
        return JsonForDatabase.create();
    }

    @Test
    void testSerializeSimpleObject() throws Exception {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("intField", 123);
        jsonObject.put("stringField", "test");
        jsonObject.put("booleanField", true);
        jsonObject.put("doubleField", 45.67);

        ObjectMapper objectMapper = getObjectMapper();
        String result = objectMapper.writeValueAsString(jsonObject);

        assertTrue(result.contains("\"intField\":123"));
        assertTrue(result.contains("\"stringField\":\"test\""));
        assertTrue(result.contains("\"booleanField\":true"));
        assertTrue(result.contains("\"doubleField\":45.67"));
    }

    @Test
    void testSerializeObjectWithNullValue() throws Exception {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("stringField", "test");
        jsonObject.put("nullField", null);

        ObjectMapper objectMapper = getObjectMapper();
        String result = objectMapper.writeValueAsString(jsonObject);

        assertTrue(result.contains("\"stringField\":\"test\""));
        assertTrue(result.contains("\"nullField\":null"));
    }

    @Test
    void testSerializeNestedObject() throws Exception {
        JSONObject nestedObject = new JSONObject();
        nestedObject.put("innerField", 42);
        nestedObject.put("innerString", "innerValue");

        JSONObject jsonObject = new JSONObject();
        jsonObject.put("nestedObject", nestedObject);

        ObjectMapper objectMapper = getObjectMapper();
        String result = objectMapper.writeValueAsString(jsonObject);

        assertTrue(result.contains("\"nestedObject\""));
        assertTrue(result.contains("\"innerField\":42"));
        assertTrue(result.contains("\"innerString\":\"innerValue\""));
    }

    @Test
    void testSerializeArray() throws Exception {
        JSONArray array = new JSONArray();
        array.add(1);
        array.add("two");
        array.add(true);
        array.add(null);

        JSONObject jsonObject = new JSONObject();
        jsonObject.put("arrayField", array);

        ObjectMapper objectMapper = getObjectMapper();
        String result = objectMapper.writeValueAsString(jsonObject);

        assertTrue(result.contains("\"arrayField\":[1,\"two\",true,null]"));
    }

    @Test
    void testSerializeComplexObject() throws Exception {
        JSONObject nestedObject = new JSONObject();
        nestedObject.put("innerInt", 5);
        nestedObject.put(
                "innerArray", new JSONArray().appendElement(1).appendElement(2).appendElement(3));
        nestedObject.put("innerObject", new JSONObject().appendField("innerKey", "innerValue"));

        JSONObject jsonObject = new JSONObject();
        jsonObject.put("intField", 10);
        jsonObject.put("stringField", "hello");
        jsonObject.put("booleanField", false);
        jsonObject.put("nestedObject", nestedObject);

        ObjectMapper objectMapper = getObjectMapper();
        String result = objectMapper.writeValueAsString(jsonObject);

        assertTrue(result.contains("\"intField\":10"));
        assertTrue(result.contains("\"stringField\":\"hello\""));
        assertTrue(result.contains("\"booleanField\":false"));
        assertTrue(result.contains("\"nestedObject\""));
        assertTrue(result.contains("\"innerInt\":5"));
        assertTrue(result.contains("\"innerArray\":[1,2,3]"));
        assertTrue(result.contains("\"innerKey\":\"innerValue\""));
    }
}
