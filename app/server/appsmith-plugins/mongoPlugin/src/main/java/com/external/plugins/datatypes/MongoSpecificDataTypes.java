package com.external.plugins.datatypes;

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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MongoSpecificDataTypes {
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
}
