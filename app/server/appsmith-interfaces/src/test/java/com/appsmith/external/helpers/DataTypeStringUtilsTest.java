package com.appsmith.external.helpers;

import com.appsmith.external.constants.DataType;
import org.junit.Test;

import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;
import static org.assertj.core.api.Assertions.assertThat;

public class DataTypeStringUtilsTest {

    @Test
    public void checkTimeStampDataType() {
        String timestamp = "2021-03-24 14:05:34";
        DataType dataType = stringToKnownDataTypeConverter(timestamp);

        assertThat(dataType).isEqualByComparingTo(DataType.TIMESTAMP);
    }

    @Test
    public void checkDateDataType() {
        String date = "2021-03-24";
        DataType dataType = stringToKnownDataTypeConverter(date);

        assertThat(dataType).isEqualByComparingTo(DataType.DATE);
    }

    @Test
    public void checkBooleanDataType() {
        String boolInput = "true";
        DataType dataType = stringToKnownDataTypeConverter(boolInput);

        assertThat(dataType).isEqualByComparingTo(DataType.BOOLEAN);
    }

    @Test
    public void checkStringDataType() {
        // Starting the string with number because earlier this was incorrectly being identified as JSON.
        String stringData = "2.1 In order to understand recursion, one must first understand recursion. -Anonymous";
        DataType dataType = stringToKnownDataTypeConverter(stringData);

        assertThat(dataType).isEqualByComparingTo(DataType.STRING);
    }

    @Test
    public void checkIntegerDataType() {
        String intData = "1234";
        DataType dataType = stringToKnownDataTypeConverter(intData);

        assertThat(dataType).isEqualByComparingTo(DataType.INTEGER);
    }

    @Test
    public void checkFloatDataType() {
        String floatData = "12.34";
        DataType dataType = stringToKnownDataTypeConverter(floatData);

        assertThat(dataType).isEqualByComparingTo(DataType.FLOAT);
    }

    @Test
    public void checkCommaDelimitedIntegerValues() {
        String strData = "54,024,464";
        DataType dataType = stringToKnownDataTypeConverter(strData);

        assertThat(dataType).isEqualByComparingTo(DataType.INTEGER);
    }

    @Test
    public void checkCommaDelimitedFloatValues() {
        String floatData = "54,024,464,177.345300";
        DataType dataType = stringToKnownDataTypeConverter(floatData);

        assertThat(dataType).isEqualByComparingTo(DataType.FLOAT);
    }

    @Test
    public void checkCommaDelimitedLongValues() {
        String strData = "454,024,464,454,987,777";
        DataType dataType = stringToKnownDataTypeConverter(strData);

        assertThat(dataType).isEqualByComparingTo(DataType.LONG);
    }

    @Test
    public void checkSimpleArrayDataType() {
        String arrayData = "[1,2,3,4]";
        DataType dataType = stringToKnownDataTypeConverter(arrayData);

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
        DataType dataType = stringToKnownDataTypeConverter(arrayData);

        assertThat(dataType).isEqualByComparingTo(DataType.ARRAY);
    }

    @Test
    public void checkJsonDataType() {
        String jsonData = "{\n" +
                "  \"key1\": \"value\"\n" +
                "}";
        DataType dataType = stringToKnownDataTypeConverter(jsonData);

        assertThat(dataType).isEqualByComparingTo(DataType.JSON_OBJECT);
    }

    @Test
    public void checkNullDataType() {
        String nullData = "null";
        DataType dataType = stringToKnownDataTypeConverter(nullData);

        assertThat(dataType).isEqualByComparingTo(DataType.NULL);
    }

    @Test
    public void testJsonStrictParsing() {
        // https://static.javadoc.io/com.google.code.gson/gson/2.8.5/com/google/gson/stream/JsonReader.html#setLenient-boolean-
        // Streams that start with the non-execute prefix, ")]}'\n".
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("){}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("]{}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("}{}"));
        // Streams that include multiple top-level values. With strict parsing, each stream must contain exactly one top-level value.
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{}{}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{}[]null"));
        // Top-level values of any type. With strict parsing, the top-level value must be an object or an array.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter(""));
        assertThat(DataType.NULL).isEqualByComparingTo(stringToKnownDataTypeConverter("null"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("Abracadabra"));
        assertThat(DataType.INTEGER).isEqualByComparingTo(stringToKnownDataTypeConverter("13"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("\"literal\""));
        assertThat(DataType.NULL).isEqualByComparingTo(stringToKnownDataTypeConverter("[]"));
        // Numbers may be NaNs or infinities.
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"number\": NaN}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"number\": Infinity}"));
        // End of line comments starting with // or # and ending with a newline character.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{//comment\n}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{#comment\n}"));
        // C-style comments starting with /* and ending with */. Such comments may not be nested.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{/*comment*/}"));
        // Names that are unquoted or 'single quoted'.
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{a: 1}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{'a': 1}"));
        // Strings that are unquoted or 'single quoted'.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": str}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": ''}"));
        // Array elements separated by ; instead of ,.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": [1;2]}"));
        // Unnecessary array separators. These are interpreted as if null was the omitted value.
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": [1,]}"));
        // Names and values separated by = or => instead of :.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\" = 13}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\" => 13}"));
        // Name/value pairs separated by ; instead of ,.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 1; \"b\": 2}"));

        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": }"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": ,}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 0,}"));

        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{} "));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": null} \n \n"));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 0}"));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": \"\"}"));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": []}"));
    }
}
