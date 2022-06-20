package com.external.plugins.utils;

import java.lang.reflect.Field;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.external.constants.DataType.*;
import static com.external.plugins.utils.OracleDataTypeUtils.DataType.DATE;
import static com.external.plugins.utils.OracleDataTypeUtils.DataType.*;

public class OracleDataTypeUtils {

    /**
     * questionWithCast will match the following sample strings in a query
     * - "?"
     * - "?::text"
     * <p>
     * Capturing only the words post "::" so that the explict data type to which the parameter must be cast can be read
     * and ignoring the group "::" from getting captured by using regex "?:" which ignores the subsequent string
     */
    private static final String questionWithCast = "\\?(?:::)*([a-zA-Z]+)*";
    private static final Pattern questionWithCastPattern = Pattern.compile(questionWithCast);

    public static DataType dataType = new DataType();

    public static class DataType {
        /**
         * Declare all the explicitly castable oracle types below. These would be automatically added to the
         * dataTypes set automatically.
         * <p>
         * !!! WARNING !!!
         * When adding a new data type to support for explicit casting, please ensure to add an entry in the Map
         * dataTypeMapper which maps the oracle data types to Appsmith data types.
         */
        // Oracle String Datatypes
        public static final String CHAR = "char";
        public static final String NCHAR = "nchar";
        public static final String VARCHAR = "varchar";
        public static final String VARCHAR2 = "varchar2";
        public static final String NVARCHAR2 = "nvarchar2";
        // Oracle Numeric datatypes
        public static final String NUMBER = "number";
        public static final String FLOAT = "float";
        public static final String BIN_FLOAT = "binary_float";
        public static final String BIN_DOUBLE = "binary_double";
        // Bool type
        public static final String BOOL = "bool";
        // Oracle Date types
        public static final String DATE = "date";
        public static final String TIMESTAMP = "timestamp";


        public Set dataTypes = null;

        public Set getDataTypes() {
            // if data types hasn't been initialized, read and set all the supported data types for oracle
            if (dataTypes == null || dataTypes.isEmpty()) {
                dataTypes = new HashSet<>();

                Field[] fields = this.getClass().getDeclaredFields();

                for (Field field : fields) {
                    if (field.getType().equals(String.class)) { // if it is a String field
                        try {
                            dataTypes.add(field.get(dataType));
                        } catch (IllegalArgumentException | IllegalAccessException e) {
                            // We weren't able to read the value of the field. Ignore this field and continue
                            // Still print the stack trace for posterity.
                            e.printStackTrace();
                        }
                    }
                }
            }
            // We are assured that data types has been set.
            return dataTypes;
        }
    }

    // Stores the mapping between oracle data types and appsmith data types
    public static Map dataTypeMapper;

    private static Map getDataTypeMapper() {
        if (dataTypeMapper == null) {
            dataTypeMapper = new HashMap<String, com.appsmith.external.constants.DataType>();
            dataTypeMapper.put(CHAR, STRING);
            dataTypeMapper.put(NCHAR, STRING);
            dataTypeMapper.put(VARCHAR, STRING);
            dataTypeMapper.put(VARCHAR2, STRING);
            dataTypeMapper.put(NVARCHAR2, STRING);
            dataTypeMapper.put(DATE, com.appsmith.external.constants.DataType.DATE);
            dataTypeMapper.put(DataType.TIMESTAMP, com.appsmith.external.constants.DataType.TIMESTAMP);
            dataTypeMapper.put(NUMBER, LONG);
            dataTypeMapper.put(DataType.FLOAT, com.appsmith.external.constants.DataType.FLOAT);
            dataTypeMapper.put(BIN_FLOAT, BINARY);
            dataTypeMapper.put(BIN_DOUBLE, BINARY);
            dataTypeMapper.put(BOOL, BOOLEAN);

            // Must ensure that all the declared oracle data types have a mapping to appsmith data types
            assert (dataTypeMapper.size() == dataType.getDataTypes().size());
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
            // and instead default to implicit type casting (default behaviour) by setting the entry to null.
            inputDataTypes.add(null);
        }

        return inputDataTypes;
    }
}
