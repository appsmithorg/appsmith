package com.external.plugins;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.datatypes.ArrayType;
import com.appsmith.external.datatypes.BigDecimalType;
import com.appsmith.external.datatypes.BooleanType;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.datatypes.DateType;
import com.appsmith.external.datatypes.DoubleType;
import com.appsmith.external.datatypes.IntegerType;
import com.appsmith.external.datatypes.JsonObjectType;
import com.appsmith.external.datatypes.LongType;
import com.appsmith.external.datatypes.NullType;
import com.appsmith.external.datatypes.StringType;
import com.appsmith.external.datatypes.TimeType;
import com.appsmith.external.datatypes.TimestampType;
import com.appsmith.external.helpers.DataTypeServiceUtils;
import com.external.plugins.datatypes.BsonType;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class MongoPluginDataTypeTest {
    public static final Map<ClientDataType, List<AppsmithType>> pluginSpecificTypes;

    static {
        pluginSpecificTypes = new HashMap<>();
        pluginSpecificTypes.put(ClientDataType.NULL, List.of(new NullType()));

        pluginSpecificTypes.put(ClientDataType.BOOLEAN, List.of(new BooleanType()));

        pluginSpecificTypes.put(ClientDataType.ARRAY, List.of(new ArrayType()));

        pluginSpecificTypes.put(
                ClientDataType.NUMBER,
                List.of(new IntegerType(), new LongType(), new DoubleType(), new BigDecimalType()));

        /*
            BSON is the superset of JSON with more data types.
            That's why JsonObjectType precedes otherwise BsonType would always take over.
        */
        pluginSpecificTypes.put(ClientDataType.OBJECT, List.of(new JsonObjectType(), new BsonType()));

        pluginSpecificTypes.put(
                ClientDataType.STRING, List.of(new TimeType(), new DateType(), new TimestampType(), new StringType()));
    }

    @Test
    public void testBsonTypes() {
        // Streams that include multiple top-level values. With strict parsing, each stream must contain exactly one
        // top-level value.
        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{}{}", pluginSpecificTypes)
                        .type());
        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{}[]null", pluginSpecificTypes)
                        .type());
        // Numbers may be NaNs or infinities.
        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{\"number\": NaN}", pluginSpecificTypes)
                        .type());
        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(
                                ClientDataType.OBJECT, "{\"number\": Infinity}", pluginSpecificTypes)
                        .type());
        // Names that are unquoted or 'single quoted'.
        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{a: 1}", pluginSpecificTypes)
                        .type());
        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{'a': 1}", pluginSpecificTypes)
                        .type());
        // Strings that are unquoted or 'single quoted'.
        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{\"a\": ''}", pluginSpecificTypes)
                        .type());
        // Unnecessary array separators. These are interpreted as if null was the omitted value.
        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{\"a\": [1,]}", pluginSpecificTypes)
                        .type());

        assertEquals(
                DataType.BSON,
                DataTypeServiceUtils.getAppsmithType(ClientDataType.OBJECT, "{\"a\": 0,}", pluginSpecificTypes)
                        .type());
    }
}
