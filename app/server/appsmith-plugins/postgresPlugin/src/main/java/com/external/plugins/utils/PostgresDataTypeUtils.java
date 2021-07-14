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

import static com.appsmith.external.constants.DataType.BOOLEAN;
import static com.appsmith.external.constants.DataType.DOUBLE;
import static com.appsmith.external.constants.DataType.FLOAT;
import static com.appsmith.external.constants.DataType.INTEGER;
import static com.appsmith.external.constants.DataType.LONG;
import static com.appsmith.external.constants.DataType.STRING;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.BOOL;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.DATE;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.DECIMAL;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.FLOAT8;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.INT;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.INT4;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.INT8;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.TEXT;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.TIME;
import static com.external.plugins.utils.PostgresDataTypeUtils.DataType.VARCHAR;

public class PostgresDataTypeUtils {

    private static String questionWithCast = "\\?(?:::)*([a-zA-Z]+)*";
    private static Pattern questionWithCastPattern = Pattern.compile(questionWithCast);
    private static String word = "([a-zA-Z]*)";
    private static Pattern wordPattern = Pattern.compile(word);

    public static DataType dataType = new DataType();

    public static class DataType {
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

        public Set dataTypes = null;

        public Set getDataTypes() {
            // if data types hasn't been initialized, read and set all the supported data types for postgres
            if (dataTypes == null || dataTypes.isEmpty()) {
                dataTypes = new HashSet<>();

                Field[] fields = this.getClass().getDeclaredFields();

                for (Field field : fields) {
                    if (field.getType().equals(String.class)) { // if it is a String field
                        try {
                            dataTypes.add(field.get(dataType));
                        } catch (IllegalAccessException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
            // We are assured that data types has been set.
            return dataTypes;
        }
    }

    public static Map dataTypeMapper;

    private static Map getDataTypeMapper() {
        if (dataTypeMapper == null) {
            dataTypeMapper = new HashMap<String, com.appsmith.external.constants.DataType>();
            dataTypeMapper.put(INT8, LONG);
            dataTypeMapper.put(INT4, INTEGER);
            dataTypeMapper.put(DECIMAL, FLOAT);
            dataTypeMapper.put(VARCHAR, STRING);
            dataTypeMapper.put(BOOL, BOOLEAN);
            dataTypeMapper.put(DATE, com.appsmith.external.constants.DataType.DATE);
            dataTypeMapper.put(TIME, com.appsmith.external.constants.DataType.TIME);
            dataTypeMapper.put(FLOAT8, DOUBLE);
            dataTypeMapper.put(TEXT, STRING);
            dataTypeMapper.put(INT, INTEGER);
        }

        return dataTypeMapper;
    }

    public static List<com.appsmith.external.constants.DataType> extractExplicitCasting(String query) {
        Matcher matcher = questionWithCastPattern.matcher(query);
        List<com.appsmith.external.constants.DataType> inputDataTypes = new ArrayList<>();

        while (matcher.find()) {
            String prospectiveDataType = matcher.group(1);

            if (prospectiveDataType != null) {
                String dataTypeFromInput = prospectiveDataType.trim().toLowerCase();
                if (dataType.getDataTypes().contains(dataTypeFromInput)) {
                    com.appsmith.external.constants.DataType appsmithDataType
                            = (com.appsmith.external.constants.DataType) getDataTypeMapper().get(dataTypeFromInput);
                    inputDataTypes.add(appsmithDataType);
                    continue;
                }
            }
            // Either no external casting exists or unsupported data type is being used. Do not use external casting for this
            inputDataTypes.add(null);
        }

        return inputDataTypes;
    }
}
