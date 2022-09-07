package com.appsmith.external.services.ce;

import com.appsmith.external.datatypes.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DataTypeServiceCEImpl implements DataTypeServiceCE {
     final Map<ClientDataType, List<AppsmithType>> defaultAppsmithTypes = new HashMap<>();

    public DataTypeServiceCEImpl() {
        defaultAppsmithTypes.put(ClientDataType.NULL, List.of(new NullType()));

        defaultAppsmithTypes.put(ClientDataType.ARRAY, List.of(new ArrayType()));

        defaultAppsmithTypes.put(ClientDataType.BOOLEAN, List.of(new BooleanType()));

        defaultAppsmithTypes.put(ClientDataType.NUMBER, List.of(
           new IntegerType(),
           new LongType(),
           new FloatType(),
           new DoubleType(),
           new BigDecimalType()
        ));

        defaultAppsmithTypes.put(ClientDataType.OBJECT, List.of(new JsonObjectType()));

        defaultAppsmithTypes.put(ClientDataType.STRING, List.of(
                new TimeType(),
                new DateType(),
                new TimestampType(),
                new StringType()
        ));
    }

    @Override
    public AppsmithType getAppsmithType(ClientDataType clientDataType, String value) {
        return this.getAppsmithType(clientDataType, value, defaultAppsmithTypes);
    }

    @Override
    public AppsmithType getAppsmithType(ClientDataType clientDataType, String value, Map<ClientDataType, List<AppsmithType>> pluginSpecificTypes) {
        for (AppsmithType currentType : pluginSpecificTypes.get(clientDataType)) {
            if (currentType.test(value)) {
                return currentType;
            }
        }
        //TODO: Send some insights to Mixpanel as this case isn't expected at all
        return null;
    }
}
