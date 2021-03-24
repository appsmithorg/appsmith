package com.appsmith.external.helpers;

import com.appsmith.external.constants.DataType;
import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class DataTypeStringUtilsTest {

    @Test
    public void checkTimeStampDataType() {
        String timestamp = "2021-03-24 14:05:34";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(timestamp);

        assertThat(dataType).isEqualByComparingTo(DataType.TIMESTAMP);
    }

    @Test
    public void checkDateDataType() {
        String date = "2021-03-24";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(date);

        assertThat(dataType).isEqualByComparingTo(DataType.DATE);
    }

    @Test
    public void checkBooleanDataType() {
        String boolInput = "true";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(boolInput);

        assertThat(dataType).isEqualByComparingTo(DataType.BOOLEAN);
    }

    @Test
    public void checkStringDataType() {
        String stringData = "In order to understand recursion, one must first understand recursion. -Anonymous";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(stringData);

        assertThat(dataType).isEqualByComparingTo(DataType.STRING);
    }

    @Test
    public void checkIntegerDataType() {
        String intData = "1234";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(intData);

        assertThat(dataType).isEqualByComparingTo(DataType.INTEGER);
    }

    @Test
    public void checkFloatDataType() {
        String floatData = "12.34";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(floatData);

        assertThat(dataType).isEqualByComparingTo(DataType.FLOAT);
    }

    @Test
    public void checkSimpleArrayDataType() {
        String arrayData = "[1,2,3,4]";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(arrayData);

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
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(arrayData);

        assertThat(dataType).isEqualByComparingTo(DataType.ARRAY);
    }

    @Test
    public void checkJsonDataType() {
        String jsonData = "{\n" +
                "  \"key1\": \"value\"\n" +
                "}";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(jsonData);

        assertThat(dataType).isEqualByComparingTo(DataType.JSON_OBJECT);
    }

    @Test
    public void checkNullDataType() {
        String nullData = "null";
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(nullData);

        assertThat(dataType).isEqualByComparingTo(DataType.NULL);
    }

}
