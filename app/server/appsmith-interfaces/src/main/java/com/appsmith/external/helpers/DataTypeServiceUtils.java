package com.appsmith.external.helpers;

import com.appsmith.external.datatypes.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DataTypeServiceUtils {
    final static Map<ClientDataType, List<AppsmithType>> defaultAppsmithTypes = new HashMap<>();

    static  {
        defaultAppsmithTypes.put(ClientDataType.NULL, List.of(new NullType()));

        defaultAppsmithTypes.put(ClientDataType.ARRAY, List.of(new ArrayType()));

        defaultAppsmithTypes.put(ClientDataType.BOOLEAN, List.of(new BooleanType()));

        defaultAppsmithTypes.put(ClientDataType.NUMBER, List.of(
                new IntegerType(),
                new LongType(),
                new DoubleType(),
                new BigDecimalType()
        ));

        /*
            JsonObjectType is the preferred server-side data type when the client-side data type is of type OBJECT.
            Fallback server-side data type for client-side OBJECT type is String.
         */
        defaultAppsmithTypes.put(ClientDataType.OBJECT, List.of(new JsonObjectType()));

        defaultAppsmithTypes.put(ClientDataType.STRING, List.of(
                new TimeType(),
                new DateType(),
                new TimestampType(),
                new StringType()
        ));
    }

    /**
     * <p>Identifies the AppsmithType from the given client-side data type and the evaluated value of the parameter with the help of the default AppsmithTypes</p>
     *
     * @param  clientDataType   the identified data type by the client-side
     * @param  value   the evaluated value of the binding parameter
     * @return         the corresponding AppsmithType from the clientDataType and the evaluated value
     */
    public static AppsmithType getAppsmithType(ClientDataType clientDataType, String value) {
        return getAppsmithType(clientDataType, value, defaultAppsmithTypes);
    }


    /**
     * <p>Identifies the AppsmithType from the given client-side data type and the evaluated value of the parameter with the help of the provided plugin-specific types</p>
     *
     * @param  clientDataType   the identified data type by the client-side
     * @param  value   the evaluated value of the binding parameter
     * @param  pluginSpecificTypes   a mapping of client-side data type and the server-side Appsmith types
     *                               <p>A consumer of this function has to provide the pluginSpecificTypes in the following way</p>
     * <pre>{@code
     *          Map<ClientDataType, List<AppsmithType>> pluginSpecificTypes = new HashMap<>();
     *
     *          pluginSpecificTypes.put(ClientDataType.NULL, List.of(new NullType()));
     *          pluginSpecificTypes.put(ClientDataType.BOOLEAN, List.of(new MySQLBooleanType()));
     *          pluginSpecificTypes.put(ClientDataType.NUMBER, List.of(
     *                 new IntegerType(),
     *                 new LongType(),
     *                 new DoubleType(),
     *                 new BigDecimalType()
     *         ));
     *         pluginSpecificTypes.put(ClientDataType.OBJECT, List.of(new JsonObjectType()));
     *         pluginSpecificTypes.put(ClientDataType.STRING, List.of(
     *                 new TimeType(),
     *                 new PluginDateType(),
     *                 new PluginDateTimeType(),
     *                 new StringType()
     *         ));
     * }</pre>
     *
     *
     * @return         the corresponding AppsmithType from the clientDataType and the evaluated value
     */
    public static AppsmithType getAppsmithType(ClientDataType clientDataType, String value, Map<ClientDataType, List<AppsmithType>> pluginSpecificTypes) {
        if (pluginSpecificTypes.get(clientDataType) != null) {
            for (AppsmithType currentType : pluginSpecificTypes.get(clientDataType)) {
                if (currentType.test(value)) {
                    return currentType;
                }
            }
        }
        //TODO: Send analytics event to Mixpanel
        //Ideally we shouldn't reach here but if we do then we will return the FallbackType
        return new FallbackType();
    }
}

