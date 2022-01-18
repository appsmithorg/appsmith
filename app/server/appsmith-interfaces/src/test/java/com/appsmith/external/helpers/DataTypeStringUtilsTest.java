package com.appsmith.external.helpers;

import com.appsmith.external.constants.DataType;
import org.junit.Test;

import static com.appsmith.external.constants.FieldName.GOOGLE_SHEET;
import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;
import static org.assertj.core.api.Assertions.assertThat;

public class DataTypeStringUtilsTest {

    @Test
    public void checkTimeStampDataType() {
        String timestamp = "2021-03-24 14:05:34";
        DataType dataType = stringToKnownDataTypeConverter(timestamp);
        DataType dataType2 = stringToKnownDataTypeConverter(timestamp, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.TIMESTAMP);
        assertThat(dataType2).isEqualByComparingTo(DataType.TIMESTAMP);
    }

    @Test
    public void checkDateDataType() {
        String date = "2021-03-24";
        DataType dataType = stringToKnownDataTypeConverter(date);
        DataType dataType2 = stringToKnownDataTypeConverter(date, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.DATE);
        assertThat(dataType2).isEqualByComparingTo(DataType.DATE);
    }

    @Test
    public void checkBooleanDataType() {
        String boolInput = "true";
        DataType dataType = stringToKnownDataTypeConverter(boolInput);
        DataType dataType2 = stringToKnownDataTypeConverter(boolInput, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.BOOLEAN);
        assertThat(dataType2).isEqualByComparingTo(DataType.BOOLEAN);
    }

    @Test
    public void checkStringDataType() {
        // Starting the string with number because earlier this was incorrectly being identified as JSON.
        String stringData = "2.1 In order to understand recursion, one must first understand recursion. -Anonymous";
        DataType dataType = stringToKnownDataTypeConverter(stringData);
        DataType dataType2 = stringToKnownDataTypeConverter(stringData, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.STRING);
        assertThat(dataType2).isEqualByComparingTo(DataType.STRING);
    }

    @Test
    public void checkIntegerDataType() {
        String intData = "1234";
        DataType dataType = stringToKnownDataTypeConverter(intData);
        DataType dataType2 = stringToKnownDataTypeConverter(intData, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.INTEGER);
        assertThat(dataType2).isEqualByComparingTo(DataType.DOUBLE);
    }


    @Test
    public void checkLongDataType() {
        String longData = "1234567890123";
        DataType dataType = stringToKnownDataTypeConverter(longData);
        DataType dataType2 = stringToKnownDataTypeConverter(longData, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.LONG);
        assertThat(dataType2).isEqualByComparingTo(DataType.DOUBLE);
    }


    @Test
    public void checkFloatDataType() {
        String floatData = "12.34";
        DataType dataType = stringToKnownDataTypeConverter(floatData);
        DataType dataType2 = stringToKnownDataTypeConverter(floatData, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.FLOAT);
        assertThat(dataType2).isEqualByComparingTo(DataType.DOUBLE);
    }

    @Test
    public void checkSimpleArrayDataType() {
        String arrayData = "[1,2,3,4]";
        DataType dataType = stringToKnownDataTypeConverter(arrayData);
        DataType dataType2 = stringToKnownDataTypeConverter(arrayData, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.ARRAY);
        assertThat(dataType2).isEqualByComparingTo(DataType.ARRAY);
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
        DataType dataType2 = stringToKnownDataTypeConverter(arrayData, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.ARRAY);
        assertThat(dataType2).isEqualByComparingTo(DataType.ARRAY);
    }

    @Test
    public void checkJsonDataType() {
        String jsonData = "{\n" +
                "  \"key1\": \"value\"\n" +
                "}";
        DataType dataType = stringToKnownDataTypeConverter(jsonData);
        DataType dataType2 = stringToKnownDataTypeConverter(jsonData, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.JSON_OBJECT);
        assertThat(dataType2).isEqualByComparingTo(DataType.JSON_OBJECT);
    }

    @Test
    public void checkNullDataType() {
        String nullData = "null";
        DataType dataType = stringToKnownDataTypeConverter(nullData);
        DataType dataType2 = stringToKnownDataTypeConverter(nullData, GOOGLE_SHEET);

        assertThat(dataType).isEqualByComparingTo(DataType.NULL);
        assertThat(dataType2).isEqualByComparingTo(DataType.NULL);
    }

    @Test
    public void testJsonStrictParsing() {
        // https://static.javadoc.io/com.google.code.gson/gson/2.8.5/com/google/gson/stream/JsonReader.html#setLenient-boolean-
        // Streams that start with the non-execute prefix, ")]}'\n".
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("){}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("){}", GOOGLE_SHEET));

        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("]{}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("]{}", GOOGLE_SHEET));

        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("}{}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("}{}", GOOGLE_SHEET));

        // Streams that include multiple top-level values. With strict parsing, each stream must contain exactly one top-level value.
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{}{}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{}{}", GOOGLE_SHEET));

        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{}[]null"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{}[]null", GOOGLE_SHEET));

        // Top-level values of any type. With strict parsing, the top-level value must be an object or an array.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter(""));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("", GOOGLE_SHEET));

        assertThat(DataType.NULL).isEqualByComparingTo(stringToKnownDataTypeConverter("null"));
        assertThat(DataType.NULL).isEqualByComparingTo(stringToKnownDataTypeConverter("null", GOOGLE_SHEET));

        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("Abracadabra"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("Abracadabra", GOOGLE_SHEET));

        assertThat(DataType.INTEGER).isEqualByComparingTo(stringToKnownDataTypeConverter("13"));
        assertThat(DataType.DOUBLE).isEqualByComparingTo(stringToKnownDataTypeConverter("13", GOOGLE_SHEET));

        assertThat(DataType.LONG).isEqualByComparingTo(stringToKnownDataTypeConverter("1234567890344"));
        assertThat(DataType.DOUBLE).isEqualByComparingTo(stringToKnownDataTypeConverter("1234567890344", GOOGLE_SHEET));

        assertThat(DataType.FLOAT).isEqualByComparingTo(stringToKnownDataTypeConverter("3444.99f"));
        assertThat(DataType.DOUBLE).isEqualByComparingTo(stringToKnownDataTypeConverter("3444.99f", GOOGLE_SHEET));

        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("\"literal\""));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("\"literal\"", GOOGLE_SHEET));

        assertThat(DataType.NULL).isEqualByComparingTo(stringToKnownDataTypeConverter("[]"));
        assertThat(DataType.NULL).isEqualByComparingTo(stringToKnownDataTypeConverter("[]", GOOGLE_SHEET));

        // Numbers may be NaNs or infinities.
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"number\": NaN}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"number\": NaN}", GOOGLE_SHEET));

        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"number\": Infinity}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"number\": Infinity}", GOOGLE_SHEET));

        // End of line comments starting with // or # and ending with a newline character.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{//comment\n}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{//comment\n}", GOOGLE_SHEET));

        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{#comment\n}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{#comment\n}", GOOGLE_SHEET));

        // C-style comments starting with /* and ending with */. Such comments may not be nested.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{/*comment*/}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{/*comment*/}", GOOGLE_SHEET));

        // Names that are unquoted or 'single quoted'.
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{a: 1}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{a: 1}", GOOGLE_SHEET));

        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{'a': 1}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{'a': 1}", GOOGLE_SHEET));

        // Strings that are unquoted or 'single quoted'.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": str}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": str}", GOOGLE_SHEET));

        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": ''}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": ''}", GOOGLE_SHEET));

        // Array elements separated by ; instead of ,.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": [1;2]}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": [1;2]}", GOOGLE_SHEET));

        // Unnecessary array separators. These are interpreted as if null was the omitted value.
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": [1,]}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": [1,]}", GOOGLE_SHEET));

        // Names and values separated by = or => instead of :.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\" = 13}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\" = 13}", GOOGLE_SHEET));

        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\" => 13}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\" => 13}", GOOGLE_SHEET));
        // Name/value pairs separated by ; instead of ,.
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 1; \"b\": 2}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 1; \"b\": 2}", GOOGLE_SHEET));


        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": }"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": }", GOOGLE_SHEET));

        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": ,}"));
        assertThat(DataType.STRING).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": ,}", GOOGLE_SHEET));

        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 0,}"));
        assertThat(DataType.BSON).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 0,}", GOOGLE_SHEET));


        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{} "));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{} ", GOOGLE_SHEET));

        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": null} \n \n"));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": null} \n \n", GOOGLE_SHEET));

        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 0}"));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": 0}", GOOGLE_SHEET));

        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": \"\"}"));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": \"\"}", GOOGLE_SHEET));

        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": []}"));
        assertThat(DataType.JSON_OBJECT).isEqualByComparingTo(stringToKnownDataTypeConverter("{\"a\": []}", GOOGLE_SHEET));
    }
}
