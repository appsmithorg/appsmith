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
}
