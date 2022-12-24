package com.external.plugins;

import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.datatypes.DoubleType;
import com.appsmith.external.datatypes.FallbackType;
import com.appsmith.external.datatypes.IntegerType;
import com.appsmith.external.datatypes.JsonObjectType;
import com.appsmith.external.datatypes.LongType;
import com.appsmith.external.datatypes.NullType;
import com.appsmith.external.datatypes.StringType;
import com.appsmith.external.datatypes.TimeType;
import com.appsmith.external.helpers.DataTypeServiceUtils;
import com.external.plugins.datatypes.MySQLBooleanType;
import com.external.plugins.datatypes.MySQLDateTimeType;
import com.external.plugins.datatypes.MySQLDateType;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static com.external.plugins.datatypes.MySQLSpecificDataTypes.pluginSpecificTypes;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class MySQLPluginDataTypeTest {
    @Test
    public void shouldBeNullType() {
        String value = "null";

        AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.NULL, value, pluginSpecificTypes);
        assertTrue(appsmithType instanceof NullType);
        assertEquals(appsmithType.performSmartSubstitution(value), null);
    }

    @Test
    public void shouldBeMySQLBooleanType() {
        String[] values = {
                "true",
                "false"
        };
        Map<String, String> booleanValueMap = Map.of(
                "true", "1",
                "false", "0"
        );

        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.BOOLEAN, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof MySQLBooleanType);
            assertEquals(appsmithType.performSmartSubstitution(value), booleanValueMap.get(value));
        }
    }

    @Test
    public void shouldBeIntegerType() {
        String[] values = {
                "0",
                "7166",
                String.valueOf(Integer.MIN_VALUE),
                String.valueOf(Integer.MAX_VALUE)
        };

        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.NUMBER, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof IntegerType);
            assertEquals(appsmithType.performSmartSubstitution(value), value);
        }
    }

    @Test
    public void shouldBeLongType() {
        String[] values = {
                "2147483648",
                "-2147483649"
        };

        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.NUMBER, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof LongType);
            assertEquals(appsmithType.performSmartSubstitution(value), value);
        }
    }

    @Test
    public void shouldBeDoubleType() {
        String[] values = {
                "323.23",
                String.valueOf(Double.MIN_VALUE),
                String.valueOf(Double.MAX_VALUE),
                String.valueOf(Double.POSITIVE_INFINITY),
                String.valueOf(Double.NEGATIVE_INFINITY)
        };

        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.NUMBER, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof DoubleType);
            assertEquals(appsmithType.performSmartSubstitution(value), value);
        }
    }

    @Test
    public void shouldBeJsonObjectTypeOrStringType() {
        String[] values = {
                "{\"a\":97,\"A\":65}",
                "{\"a\":97,\"A\":65"
        };
        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof JsonObjectType || appsmithType instanceof FallbackType);
        }

    }

    @Test
    public void shouldBeTimeType() {
        String[] values = {
                "10:15:30",
                "10:15"
        };
        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof TimeType);
        }
    }

    @Test
    public void shouldBeDateType() {
        String[] values = {
                "2011-12-03",
                "20111203",
                "2022/09/25",
                "220924"
        };
        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof MySQLDateType);
        }
    }

    @Test
    public void shouldBeMySQLDateTimeType() {
        String[] values = {
                "2021-03-24 14:05:34",
                "2011-12-03T10:15:30+01:00",
                "2022/09/05 23:55:33",
                "20220905234556",
                "220905234556"
        };
        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof MySQLDateTimeType);
        }
    }

    @Test
    public void shouldBeStringType() {
        String[] values = {
                "Hello, world!",
                "123",
                "098876",
                "2022/09/252",
                "",
                "10:15:30+06:00",
                "2021-03-24 14:05:343"
        };
        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof StringType);
        }
    }

    @Test
    public void arrayTypeShouldBeStringType() {
        String[] values = {
                "[3,31,12]",
                "[]"
        };
        for (String value : values) {
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(ClientDataType.ARRAY, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof StringType || appsmithType instanceof FallbackType);
        }
    }
}
