package com.appsmith.external.helpers;

import com.appsmith.external.constants.AppsmithType;
import com.appsmith.external.constants.DisplayAppsmithType;
import com.appsmith.external.models.ParsedAppsmithType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.DataTypeStringUtils.getDisplayAppsmithTypes;
import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownAppsmithTypeConverter;
import static org.assertj.core.api.Assertions.assertThat;

public class DataTypeStringUtilsTest {

    @Test
    public void checkTimeStampAppsmithType() {
        String timestamp = "2021-03-24 14:05:34";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(timestamp);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.TIMESTAMP);
    }

    @Test
    public void checkDateAppsmithType() {
        String date = "2021-03-24";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(date);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.DATE);
    }

    @Test
    public void checkBooleanAppsmithType() {
        String boolInput = "true";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(boolInput);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.BOOLEAN);
    }

    @Test
    public void checkStringAppsmithType() {
        // Starting the string with number because earlier this was incorrectly being identified as JSON.
        String stringData = "2.1 In order to understand recursion, one must first understand recursion. -Anonymous";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(stringData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.STRING);
    }

    @Test
    public void checkIntegerAppsmithType() {
        String intData = "1234";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(intData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.INTEGER);
    }

    @Test
    public void checkFloatAppsmithType() {
        String floatData = "12.34";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(floatData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.FLOAT);
    }

    @Test
    public void checkCommaDelimitedIntegerValues() {
        String strData = "54,024,464";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(strData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.INTEGER);
    }

    @Test
    public void checkCommaDelimitedFloatValues() {
        String floatData = "54,024,464,177.345300";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(floatData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.FLOAT);
    }

    @Test
    public void checkCommaDelimitedLongValues() {
        String strData = "454,024,464,454,987,777";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(strData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.LONG);
    }

    @Test
    public void checkSimpleArrayAppsmithType() {
        String arrayData = "[1,2,3,4]";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(arrayData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.ARRAY);
    }

    @Test
    public void checkArrayOfObjectsAppsmithType() {
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
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(arrayData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.ARRAY);
    }

    @Test
    public void checkJsonAppsmithType() {
        String jsonData = "{\n" +
                "  \"key1\": \"value\"\n" +
                "}";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(jsonData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.JSON_OBJECT);
    }

    @Test
    public void checkNullAppsmithType() {
        String nullData = "null";
        AppsmithType AppsmithType = stringToKnownAppsmithTypeConverter(nullData);

        assertThat(AppsmithType).isEqualByComparingTo(AppsmithType.NULL);
    }

    @Test
    public void testJsonStrictParsing() {
        // https://static.javadoc.io/com.google.code.gson/gson/2.8.5/com/google/gson/stream/JsonReader.html#setLenient-boolean-
        // Streams that start with the non-execute prefix, ")]}'\n".
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("){}"));
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("]{}"));
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("}{}"));
        // Streams that include multiple top-level values. With strict parsing, each stream must contain exactly one top-level value.
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{}{}"));
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{}[]null"));
        // Top-level values of any type. With strict parsing, the top-level value must be an object or an array.
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter(""));
        assertThat(AppsmithType.NULL).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("null"));
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("Abracadabra"));
        assertThat(AppsmithType.INTEGER).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("13"));
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("\"literal\""));
        assertThat(AppsmithType.NULL).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("[]"));
        // Numbers may be NaNs or infinities.
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"number\": NaN}"));
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"number\": Infinity}"));
        // End of line comments starting with // or # and ending with a newline character.
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{//comment\n}"));
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{#comment\n}"));
        // C-style comments starting with /* and ending with */. Such comments may not be nested.
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{/*comment*/}"));
        // Names that are unquoted or 'single quoted'.
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{a: 1}"));
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{'a': 1}"));
        // Strings that are unquoted or 'single quoted'.
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": str}"));
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": ''}"));
        // Array elements separated by ; instead of ,.
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": [1;2]}"));
        // Unnecessary array separators. These are interpreted as if null was the omitted value.
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": [1,]}"));
        // Names and values separated by = or => instead of :.
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\" = 13}"));
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\" => 13}"));
        // Name/value pairs separated by ; instead of ,.
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": 1; \"b\": 2}"));

        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": }"));
        assertThat(AppsmithType.STRING).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": ,}"));
        assertThat(AppsmithType.BSON).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": 0,}"));

        assertThat(AppsmithType.JSON_OBJECT).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{} "));
        assertThat(AppsmithType.JSON_OBJECT).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": null} \n \n"));
        assertThat(AppsmithType.JSON_OBJECT).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": 0}"));
        assertThat(AppsmithType.JSON_OBJECT).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": \"\"}"));
        assertThat(AppsmithType.JSON_OBJECT).isEqualByComparingTo(stringToKnownAppsmithTypeConverter("{\"a\": []}"));
    }

    @Test
    public void testGetDisplayAppsmithTypes_withNestedObjectsInList_returnsWithTable() {

        final List<Object> data = new ArrayList<>();
        final Map<String, Object> objectMap = new HashMap<>();
        final Map<String, Object> nestedObjectMap = new HashMap<>();
        nestedObjectMap.put("k2", "v2");
        objectMap.put("k", nestedObjectMap);

        data.add(objectMap);
        final List<ParsedAppsmithType> displayAppsmithTypes = getDisplayAppsmithTypes(data);

        assertThat(displayAppsmithTypes).anyMatch(parsedAppsmithType -> parsedAppsmithType.getAppsmithType().equals(DisplayAppsmithType.TABLE));
    }

    @Test
    public void testGetDisplayAppsmithTypes_withNestedObjectsInArrayNode_returnsWithTable() {
        final ObjectMapper objectMapper = new ObjectMapper();
        final ArrayNode data = objectMapper.createArrayNode();
        final ObjectNode objectNode = objectMapper.createObjectNode();
        final ObjectNode nestedObjectNode = objectMapper.createObjectNode();
        nestedObjectNode.put("k2", "v2");
        objectNode.set("k", nestedObjectNode);

        data.add(objectNode);
        final List<ParsedAppsmithType> displayAppsmithTypes = getDisplayAppsmithTypes(data);

        assertThat(displayAppsmithTypes).anyMatch(parsedAppsmithType -> parsedAppsmithType.getAppsmithType().equals(DisplayAppsmithType.TABLE));
    }

    @Test
    public void testGetDisplayAppsmithTypes_withNestedObjectsInString_returnsWithTable() {
        final ObjectMapper objectMapper = new ObjectMapper();
        final ArrayNode data = objectMapper.createArrayNode();
        final ObjectNode objectNode = objectMapper.createObjectNode();
        final ObjectNode nestedObjectNode = objectMapper.createObjectNode();
        nestedObjectNode.put("k2", "v2");
        objectNode.set("k", nestedObjectNode);

        data.add(objectNode);
        final List<ParsedAppsmithType> displayAppsmithTypes = getDisplayAppsmithTypes(data.toString());

        assertThat(displayAppsmithTypes).anyMatch(parsedAppsmithType -> parsedAppsmithType.getAppsmithType().equals(DisplayAppsmithType.TABLE));
    }
}
