package com.external.plugins.utils;

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
import com.appsmith.external.datatypes.NullArrayType;
import com.appsmith.external.datatypes.NullType;
import com.appsmith.external.datatypes.StringType;
import com.appsmith.external.datatypes.TimeType;
import com.appsmith.external.datatypes.TimestampType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OracleSpecificDataTypes {
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
}
