package com.external.plugins;

import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.datatypes.ArrayType;
import com.appsmith.external.datatypes.BigDecimalType;
import com.appsmith.external.datatypes.BooleanType;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.datatypes.DateType;
import com.appsmith.external.datatypes.DoubleType;
import com.appsmith.external.datatypes.FallbackType;
import com.appsmith.external.datatypes.IntegerType;
import com.appsmith.external.datatypes.JsonObjectType;
import com.appsmith.external.datatypes.LongType;
import com.appsmith.external.datatypes.NullArrayType;
import com.appsmith.external.datatypes.NullType;
import com.appsmith.external.datatypes.StringType;
import com.appsmith.external.datatypes.TimeType;
import com.appsmith.external.datatypes.TimestampType;
import com.appsmith.external.helpers.DataTypeServiceUtils;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class PostgresPluginDataTypeTest {
    public static final Map<ClientDataType, List<AppsmithType>> pluginSpecificTypes = new HashMap<>();

    static {
        pluginSpecificTypes.put(ClientDataType.NULL, List.of(new NullType()));

        pluginSpecificTypes.put(ClientDataType.ARRAY, List.of(new NullArrayType(), new ArrayType()));

        pluginSpecificTypes.put(ClientDataType.BOOLEAN, List.of(new BooleanType()));

        pluginSpecificTypes.put(
                ClientDataType.NUMBER,
                List.of(new IntegerType(), new LongType(), new DoubleType(), new BigDecimalType()));

        /*
           JsonObjectType is the preferred server-side data type when the client-side data type is of type OBJECT.
           Fallback server-side data type for client-side OBJECT type is String.
        */
        pluginSpecificTypes.put(ClientDataType.OBJECT, List.of(new JsonObjectType()));

        pluginSpecificTypes.put(
                ClientDataType.STRING, List.of(new TimeType(), new DateType(), new TimestampType(), new StringType()));
    }

    @Test
    public void shouldBeNullType() {
        String value = "null";

        AppsmithType appsmithType =
                DataTypeServiceUtils.getAppsmithType(ClientDataType.NULL, value, pluginSpecificTypes);
        assertTrue(appsmithType instanceof NullType);
        assertEquals(appsmithType.performSmartSubstitution(value), null);
    }

    @Test
    public void shouldBeBooleanType() {
        String[] values = {"true", "false"};

        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.BOOLEAN, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof BooleanType);
            assertEquals(appsmithType.performSmartSubstitution(value), value);
        }
    }

    @Test
    public void shouldBeIntegerType() {
        String[] values = {"0", "7166", String.valueOf(Integer.MIN_VALUE), String.valueOf(Integer.MAX_VALUE)};

        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.NUMBER, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof IntegerType);
            assertEquals(appsmithType.performSmartSubstitution(value), value);
        }
    }

    @Test
    public void shouldBeLongType() {
        String[] values = {"2147483648", "-2147483649"};

        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.NUMBER, value, pluginSpecificTypes);
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
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.NUMBER, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof DoubleType);
            assertEquals(appsmithType.performSmartSubstitution(value), value);
        }
    }

    @Test
    public void shouldBeJsonObjectTypeOrStringType() {
        String[] values = {"{\"a\":97,\"A\":65}", "{\"a\":97,\"A\":65"};
        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof JsonObjectType || appsmithType instanceof FallbackType);
        }
    }

    @Test
    public void shouldBeTimeType() {
        String[] values = {"10:15:30", "10:15"};
        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof TimeType);
        }
    }

    @Test
    public void shouldBeDateType() {
        String[] values = {"2011-12-03"};
        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof DateType);
        }
    }

    @Test
    public void shouldBeTimestampType() {
        String[] values = {"2021-03-24 14:05:34"};
        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof TimestampType);
        }
    }

    @Test
    public void shouldBeStringType() {
        String[] values = {"Hello, world!", "123", "098876", "2022/09/252", "", "10:15:30+06:00", "2021-03-24 14:05:343"
        };
        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.STRING, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof StringType);
        }
    }

    @Test
    public void shouldNullArrayType() {
        String[] values = {"[]"};
        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.ARRAY, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof NullArrayType);
        }
    }

    @Test
    public void shouldArrayType() {
        String[] values = {"[71]"};
        for (String value : values) {
            AppsmithType appsmithType =
                    DataTypeServiceUtils.getAppsmithType(ClientDataType.ARRAY, value, pluginSpecificTypes);
            assertTrue(appsmithType instanceof ArrayType);
        }
    }
}
