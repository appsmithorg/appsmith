package com.external.plugins.utils;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.external.constants.AppsmithType.BOOLEAN;
import static com.appsmith.external.constants.AppsmithType.DOUBLE;
import static com.appsmith.external.constants.AppsmithType.FLOAT;
import static com.appsmith.external.constants.AppsmithType.INTEGER;
import static com.appsmith.external.constants.AppsmithType.LONG;
import static com.appsmith.external.constants.AppsmithType.STRING;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.BOOL;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.DATE;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.DECIMAL;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.FLOAT8;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.INT;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.INT4;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.INT8;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.TEXT;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.TIME;
import static com.external.plugins.utils.PostgresAppsmithTypeUtils.AppsmithType.VARCHAR;

public class PostgresAppsmithTypeUtils {

    /**
     * questionWithCast will match the following sample strings in a query
     * - "?"
     * - "?::text"
     *
     * Capturing only the words post "::" so that the explict data type to which the parameter must be cast can be read
     * and ignoring the group "::" from getting captured by using regex "?:" which ignores the subsequent string
     */
    private static String questionWithCast = "\\?(?:::)*([a-zA-Z]+)*";
    private static Pattern questionWithCastPattern = Pattern.compile(questionWithCast);

    public static AppsmithType AppsmithType = new AppsmithType();

    public static class AppsmithType {
        /**
         * Declare all the explicitly castable postgresql types below. These would be automatically added to the
         * AppsmithTypes set automatically.
         *
         * !!! WARNING !!!
         * When adding a new data type to support for explicit casting, please ensure to add an entry in the Map
         * AppsmithTypeMapper which maps the postgres data types to Appsmith data types.
         */
        public static final String INT8 = "int8";
        public static final String INT4 = "int4";
        public static final String DECIMAL = "decimal";
        public static final String VARCHAR = "varchar";
        public static final String BOOL = "bool";
        public static final String DATE = "date";
        public static final String TIME = "time";
        public static final String FLOAT8 = "float8";
        public static final String TEXT = "text";
        public static final String INT = "int";

        public Set AppsmithTypes = null;

        public Set getAppsmithTypes() {
            // if data types hasn't been initialized, read and set all the supported data types for postgres
            if (AppsmithTypes == null || AppsmithTypes.isEmpty()) {
                AppsmithTypes = new HashSet<>();

                Field[] fields = this.getClass().getDeclaredFields();

                for (Field field : fields) {
                    if (field.getType().equals(String.class)) { // if it is a String field
                        try {
                            AppsmithTypes.add(field.get(AppsmithType));
                        } catch (IllegalArgumentException | IllegalAccessException e) {
                            // We weren't able to read the value of the field. Ignore this field and continue
                            // Still print the stack trace for posterity.
                            e.printStackTrace();
                        }
                    }
                }
            }
            // We are assured that data types has been set.
            return AppsmithTypes;
        }
    }

    // Stores the mapping between postgres data types and appsmith data types
    public static Map AppsmithTypeMapper;

    private static Map getAppsmithTypeMapper() {
        if (AppsmithTypeMapper == null) {
            AppsmithTypeMapper = new HashMap<String, com.appsmith.external.constants.AppsmithType>();
            AppsmithTypeMapper.put(INT8, LONG);
            AppsmithTypeMapper.put(INT4, INTEGER);
            AppsmithTypeMapper.put(DECIMAL, FLOAT);
            AppsmithTypeMapper.put(VARCHAR, STRING);
            AppsmithTypeMapper.put(BOOL, BOOLEAN);
            AppsmithTypeMapper.put(DATE, com.appsmith.external.constants.AppsmithType.DATE);
            AppsmithTypeMapper.put(TIME, com.appsmith.external.constants.AppsmithType.TIME);
            AppsmithTypeMapper.put(FLOAT8, DOUBLE);
            AppsmithTypeMapper.put(TEXT, STRING);
            AppsmithTypeMapper.put(INT, INTEGER);

            // Must ensure that all the declared postgres data types have a mapping to appsmith data types
            assert(AppsmithTypeMapper.size() == AppsmithType.getAppsmithTypes().size());
        }

        return AppsmithTypeMapper;
    }

    public static List<com.appsmith.external.constants.AppsmithType> extractExplicitCasting(String query) {
        Matcher matcher = questionWithCastPattern.matcher(query);
        List<com.appsmith.external.constants.AppsmithType> inputAppsmithTypes = new ArrayList<>();

        while (matcher.find()) {
            String prospectiveAppsmithType = matcher.group(1);

            if (prospectiveAppsmithType != null) {
                String AppsmithTypeFromInput = prospectiveAppsmithType.trim().toLowerCase();
                if (AppsmithType.getAppsmithTypes().contains(AppsmithTypeFromInput)) {
                    com.appsmith.external.constants.AppsmithType appsmithAppsmithType
                            = (com.appsmith.external.constants.AppsmithType) getAppsmithTypeMapper().get(AppsmithTypeFromInput);
                    inputAppsmithTypes.add(appsmithAppsmithType);
                    continue;
                }
            }
            // Either no external casting exists or unsupported data type is being used. Do not use external casting for this
            // and instead default to implicit type casting (default behaviour) by setting the entry to null.
            inputAppsmithTypes.add(null);
        }

        return inputAppsmithTypes;
    }
}
