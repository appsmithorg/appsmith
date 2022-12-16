package com.appsmith.external.helpers;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.constants.DisplayDataType;
import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.models.ParsedDataType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.DataTypeStringUtils.getDisplayDataTypes;
import static com.appsmith.external.helpers.DataTypeStringUtils.jsonSmartReplacementPlaceholderWithValue;
import static org.assertj.core.api.Assertions.assertThat;


public class DataTypeStringUtilsTest {

    @Test
    public void checkTimeStampDataType() {
        String timestamp = "2021-03-24 14:05:34";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, timestamp);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.TIMESTAMP);
    }

    @Test
    public void checkDateDataType() {
        String date = "2021-03-24";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, date);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.DATE);
    }

    @Test
    public void checkBooleanDataType() {
        String boolInput = "true";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.BOOLEAN, boolInput);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.BOOLEAN);
    }

    @Test
    public void checkStringDataType() {
        // Starting the string with number because earlier this was incorrectly being identified as JSON.
        String stringData = "2.1 In order to understand recursion, one must first understand recursion. -Anonymous";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, stringData);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.STRING);
    }

    @Test
    public void checkIntegerDataType() {
        String intData = "1234";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.NUMBER, intData);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.INTEGER);
    }

    @Test
    public void checkSimpleArrayDataType() {
        String arrayData = "[1,2,3,4]";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.ARRAY, arrayData);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.ARRAY);
    }

    @Test
    public void checkArrayOfObjectsDataType() {
        String arrayData = "[\n" +
                "  {\n" +
                "    \"key1\": \"value\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"key2\": \"value\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"key3\": \"value\"\n" +
                "  }\n" +
                "]";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.ARRAY, arrayData);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.ARRAY);
    }

    @Test
    public void checkJsonDataType() {
        String jsonData = "{\n" +
                "  \"key1\": \"value\"\n" +
                "}";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, jsonData);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.JSON_OBJECT);
    }

    @Test
    public void checkNullDataType() {
        String nullData = "null";
        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.NULL, nullData);
        DataType dataType = appsmithType.type();

        assertThat(dataType).isEqualByComparingTo(DataType.NULL);
    }

    @Test
    public void testJsonStrictParsing() {
        // https://static.javadoc.io/com.google.code.gson/gson/2.8.5/com/google/gson/stream/JsonReader.html#setLenient-boolean-
        // Streams that start with the non-execute prefix, ")]}'\n".
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"){}").type());
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"]{}").type());
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"}{}").type());
        // Top-level values of any type. With strict parsing, the top-level value must be an object or an array.
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"").type());
        assertThat(DataType.NULL).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.NULL,"null").type());
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"Abracadabra").type());
        assertThat(DataType.INTEGER).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.NUMBER,"13").type());
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"\"literal\"").type());

        // End of line comments starting with // or # and ending with a newline character.
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"{//comment\n}").type());
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"{#comment\n}").type());

        // C-style comments starting with /* and ending with */. Such comments may not be nested.
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"{/*comment*/}").type());

        // Strings that are unquoted or 'single quoted'.
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"{\"a\": str}").type());

        // Array elements separated by ; instead of ,.
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"{\"a\": [1;2]}").type());
        // Unnecessary array separators. These are interpreted as if null was the omitted value.

        // Names and values separated by = or => instead of :.
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"{\"a\" = 13}").type());
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"{\"a\" => 13}").type());
        // Name/value pairs separated by ; instead of ,.
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING,"{\"a\": 1; \"b\": 2}").type());

        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, "{\"a\": }").type());
        assertThat(DataType.STRING).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, "{\"a\": ,}").type());

        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{} ").type());
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{\"a\": null} \n \n").type());
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{\"a\": 0}").type());
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{\"a\": \"\"}").type());
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{\"a\": []}").type());
        assertThat(DataType.ARRAY).isEqualByComparingTo(DataTypeServiceUtils.getAppsmithType(ClientDataType.ARRAY, "[]").type());
    }

    @Test
    public void testGetDisplayDataTypes_withNestedObjectsInList_returnsWithTable() {

        final List<Object> data = new ArrayList<>();
        final Map<String, Object> objectMap = new HashMap<>();
        final Map<String, Object> nestedObjectMap = new HashMap<>();
        nestedObjectMap.put("k2", "v2");
        objectMap.put("k", nestedObjectMap);

        data.add(objectMap);
        final List<ParsedDataType> displayDataTypes = getDisplayDataTypes(data);

        assertThat(displayDataTypes).anyMatch(parsedDataType -> parsedDataType.getDataType().equals(DisplayDataType.TABLE));
    }

    @Test
    public void testGetDisplayDataTypes_withNestedObjectsInArrayNode_returnsWithTable() {
        final ObjectMapper objectMapper = new ObjectMapper();
        final ArrayNode data = objectMapper.createArrayNode();
        final ObjectNode objectNode = objectMapper.createObjectNode();
        final ObjectNode nestedObjectNode = objectMapper.createObjectNode();
        nestedObjectNode.put("k2", "v2");
        objectNode.set("k", nestedObjectNode);

        data.add(objectNode);
        final List<ParsedDataType> displayDataTypes = getDisplayDataTypes(data);

        assertThat(displayDataTypes).anyMatch(parsedDataType -> parsedDataType.getDataType().equals(DisplayDataType.TABLE));
    }

    @Test
    public void testGetDisplayDataTypes_withNestedObjectsInString_returnsWithTable() {
        final ObjectMapper objectMapper = new ObjectMapper();
        final ArrayNode data = objectMapper.createArrayNode();
        final ObjectNode objectNode = objectMapper.createObjectNode();
        final ObjectNode nestedObjectNode = objectMapper.createObjectNode();
        nestedObjectNode.put("k2", "v2");
        objectNode.set("k", nestedObjectNode);

        data.add(objectNode);
        final List<ParsedDataType> displayDataTypes = getDisplayDataTypes(data.toString());

        assertThat(displayDataTypes).anyMatch(parsedDataType -> parsedDataType.getDataType().equals(DisplayDataType.TABLE));
    }

    @Test
    public void testJsonSmartReplacementPlaceholderWithValue_withReplacementDataTypeArray_returnsCorrectMultilineString() {
        final String input = "#_appsmith_placeholder#";
        final String replacement = "[{\"Address\":\"Line1.\\nLine2.\\nLine3\"}]";

        List<Map.Entry<String, String>> insertedParams = (List) new ArrayList<>();

        final String replacedValue = jsonSmartReplacementPlaceholderWithValue(
            input,
            replacement,
            DataType.ARRAY,
            insertedParams,
            null,
                null
        );
        final String expectedValue = "[{\"Address\":\"Line1.\\nLine2.\\nLine3\"}]";
        assertThat(expectedValue).isEqualTo(replacedValue);
    }
}
