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
        String stringData = "In order to understand recursion, one must first understand recursion. -Anonymous";
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

}
