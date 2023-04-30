package com.appsmith.external.helpers;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.lang.reflect.Type;
import java.sql.Connection;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.CommonFieldName.CHILDREN;
import static com.appsmith.external.constants.CommonFieldName.CONDITION;
import static com.appsmith.external.constants.CommonFieldName.KEY;
import static com.appsmith.external.constants.CommonFieldName.VALUE;

@Slf4j
public class PluginUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    public static final TypeReference<String> STRING_TYPE = new TypeReference<>() {
        @Override
        public Type getType() {
            return String.class;
        }
    };

    public static final TypeReference<Object> OBJECT_TYPE = new TypeReference<>() {
    };

    // Pattern to match all words in the text
    private static final Pattern WORD_PATTERN = Pattern.compile("\\w+");

    /**
     * - Regex to match everything inside double or single quotes, including the quotes.
     * - e.g. Earth "revolves'" '"around"' "the" 'sun' will match:
     * (1) "revolves'"
     * (2) '"around"'
     * (3) "the"
     * (4) 'sun'
     * - ref: https://stackoverflow.com/questions/171480/regex-grabbing-values-between-quotation-marks
     */
    public static String MATCH_QUOTED_WORDS_REGEX = "([\\\"'])(?:(?=(\\\\?))\\2.)*?\\1";

    public static List<String> getColumnsListForJdbcPlugin(ResultSetMetaData metaData) throws SQLException {
        List<String> columnsList = IntStream
                .range(1, metaData.getColumnCount()+1) // JDBC column indexes start from 1
                .mapToObj(i -> {
                    try {
                        return metaData.getColumnName(i);
                    } catch (SQLException exception) {
                        /*
                         * - Need suggestions on alternative ways of handling this exception.
                         */
                        throw new RuntimeException(exception);
                    }
                })
                .collect(Collectors.toList());

        return columnsList;
    }

    public static List<String> getIdenticalColumns(List<String> columnNames) {
        /*
         * - Get frequency of each column name
         */
        Map<String, Long> columnFrequencies = columnNames
                .stream()
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        /*
         * - Filter only the inputs which have frequency greater than 1
         */
        List<String> identicalColumns = columnFrequencies.entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .map(entry -> entry.getKey())
                .collect(Collectors.toList());

        return identicalColumns;
    }

    public static String getActionConfigurationPropertyPath(int index) {
        return "actionConfiguration.pluginSpecifiedTemplates[" + index + "].value";
    }

    public static String getPSParamLabel(int i) {
        return "$" + i;
    }

    public static Boolean validConfigurationPresentInFormData(Map<String, Object> formData, String field) {
        return getValueSafelyFromFormData(formData, field) != null;
    }

    public static <T> Boolean validDataConfigurationPresentInFormData(Map<String, Object> formData, String field, TypeReference<T> type) {
        return getDataValueSafelyFromFormData(formData, field, type) != null;
    }

    private static <T> T getDataValueAsTypeFromFormData(Map<String, Object> formDataValueMap, TypeReference<T> type) {
        assert formDataValueMap != null;
        final Object formDataValue = formDataValueMap.get("data");
        if (formDataValueMap.containsKey("viewType") && "json".equals(formDataValueMap.get("viewType")) && type != STRING_TYPE) {
            try {
                return objectMapper.readValue((String) formDataValue, type);
            } catch (JsonProcessingException e) {
                log.error("Could not parse String {} to type {}", formDataValue, type);
                return null;
            }
        }
        return formDataValue != null ? (T) formDataValue : null;
    }

    /**
     * Get value from `formData` map and also type cast it to the class of type `T` before returning the value. In
     * case the value is null, then the defaultValue is returned.
     *
     * @param formData
     * @param field        : key path used to fetch value from formData
     * @param type         : returned value is type casted to the type of this object before return.
     * @param defaultValue : this value is returned if the obtained value is null
     * @param <T>          : type parameter to which the obtained value is cast to.
     * @return : obtained value (post type cast) if non-null, otherwise defaultValue
     */
    public static <T> T getDataValueSafelyFromFormData(Map<String, Object> formData, String field, TypeReference<T> type,
                                                       T defaultValue) {
        Map<String, Object> formDataValueMap = (Map<String, Object>) getValueSafelyFromFormData(formData, field);
        if (formDataValueMap == null) {
            return defaultValue;
        }
        final T valueAsTypeFromFormData = getDataValueAsTypeFromFormData(formDataValueMap, type);
        if (valueAsTypeFromFormData == null) {
            return defaultValue;
        }
        return valueAsTypeFromFormData;
    }

    public static String getTrimmedStringDataValueSafelyFromFormData(Map<String, Object> formData, String field) {
        Map<String, Object> formDataValueMap = (Map<String, Object>) getValueSafelyFromFormData(formData, field);
        if (formDataValueMap == null) {
            return null;
        }
        String stringValue = getDataValueAsTypeFromFormData(formDataValueMap, STRING_TYPE);
        if (stringValue != null) {
            stringValue = stringValue.trim();
        }
        return stringValue;
    }

    /**
     * Get value from `formData` map and also type cast it to the class of type `T` before returning the value.
     *
     * @param formData
     * @param field    : key path used to fetch value from formData
     * @param type     : returned value is type casted to the type of this object before return.
     * @param <T>      : type parameter to which the obtained value is cast to.
     * @return : obtained value (post type cast) if non-null, otherwise null.
     */
    public static <T> T getDataValueSafelyFromFormData(Map<String, Object> formData, String field, TypeReference<T> type) {
        Map<String, Object> formDataValueMap = (Map<String, Object>) getValueSafelyFromFormData(formData, field);
        if (formDataValueMap == null) {
            return null;
        }
        return getDataValueAsTypeFromFormData(formDataValueMap, type);
    }

    public static <T> T getValueSafelyFromFormData(Map<String, Object> formData, String field, Class<T> type,
                                                    T defaultValue) {
        Object value = getValueSafelyFromFormData(formData, field);
        return value == null ? defaultValue : (T) value;
    }

    public static Object getValueSafelyFromFormData(Map<String, Object> formData, String field) {
        if (CollectionUtils.isEmpty(formData)) {
            return null;
        }

        // formData exists and is not empty. Continue with fetching the value for the field

        /**
         * For a given fieldname : parent.child.grandchild, in the formData, there would be a key called "parent"
         * which stores the parent map. In the map stored for parent, there would be a key called "child"
         * which stores the child map. In the child map, there would be a key called grandchild which stores the value
         * corresponding to the fieldname `parent.child.grandchild`
         */
        // This field value contains nesting
        if (field.contains(".")) {

            String[] fieldNames = field.split("\\.");

            Map<String, Object> nestedMap = (Map<String, Object>) formData.get(fieldNames[0]);

            String[] trimmedFieldNames = Arrays.copyOfRange(fieldNames, 1, fieldNames.length);
            String nestedFieldName = String.join(".", trimmedFieldNames);

            // Now get the value from the new nested map using trimmed field name (without the parent key)
            return getValueSafelyFromFormData(nestedMap, nestedFieldName);
        } else {
            // This is a top level field. Return the value
            return formData.getOrDefault(field, null);
        }

    }

    public static String getValueSafelyFromFormDataAsString(Map<String, Object> formData, String field) {

        Object output = getValueSafelyFromFormData(formData, field);

        if (output == null) {
            return null;
        } else {
            return String.valueOf(output);
        }
    }

    public static void setDataValueSafelyInFormData(Map<String, Object> formData, String field, Object value) {

        // In case the formData has not been initialized before the fxn call, assign a new HashMap to the variable
        if (formData == null) {
            formData = new HashMap<>();
        }

        // This field value contains nesting
        if (field.contains(".")) {

            String[] fieldNames = field.split("\\.");

            // In case the parent key does not exist in the map, create one
            formData.putIfAbsent(fieldNames[0], new HashMap<String, Object>());

            Map<String, Object> nestedMap = (Map<String, Object>) formData.get(fieldNames[0]);

            String[] trimmedFieldNames = Arrays.copyOfRange(fieldNames, 1, fieldNames.length);
            String nestedFieldName = String.join(".", trimmedFieldNames);

            // Now set the value from the new nested map using trimmed field name (without the parent key)
            setDataValueSafelyInFormData(nestedMap, nestedFieldName, value);
        } else {
            // This is a top level field. Set the value
            final Object currentValue = formData.get(field);
            if (currentValue instanceof Map) {
                ((Map<String, Object>) currentValue).put("data", value);
            } else {
                final HashMap<Object, Object> valueMap = new HashMap<>();
                valueMap.put("data", value);
                formData.put(field, valueMap);
            }
        }
    }

    public static void setValueSafelyInFormData(Map<String, Object> formData, String field, Object value) {

        // In case the formData has not been initialized before the fxn call, assign a new HashMap to the variable
        if (formData == null) {
            formData = new HashMap<>();
        }

        // This field value contains nesting
        if (field.contains(".")) {

            String[] fieldNames = field.split("\\.");

            // In case the parent key does not exist in the map, create one
            formData.putIfAbsent(fieldNames[0], new HashMap<String, Object>());

            Map<String, Object> nestedMap = (Map<String, Object>) formData.get(fieldNames[0]);

            String[] trimmedFieldNames = Arrays.copyOfRange(fieldNames, 1, fieldNames.length);
            String nestedFieldName = String.join(".", trimmedFieldNames);

            // Now set the value from the new nested map using trimmed field name (without the parent key)
            setValueSafelyInFormData(nestedMap, nestedFieldName, value);
        } else {
            // This is a top level field. Set the value
            formData.put(field, value);
        }
    }

    public static boolean endpointContainsLocalhost(Endpoint endpoint) {
        if (endpoint == null || StringUtils.isEmpty(endpoint.getHost())) {
            return false;
        }

        List<String> localhostUrlIdentifiers = new ArrayList<>();
        localhostUrlIdentifiers.add("localhost");
        localhostUrlIdentifiers.add("host.docker.internal");
        localhostUrlIdentifiers.add("127.0.0.1");

        String host = endpoint.getHost().toLowerCase();
        return localhostUrlIdentifiers.stream()
                .anyMatch(identifier -> host.contains(identifier));
    }

    /**
     * Check if the URL supplied by user is pointing to localhost. If so, then return a hint message.
     *
     * @param datasourceConfiguration
     * @return a set containing a hint message.
     */
    public static Set<String> getHintMessageForLocalhostUrl(DatasourceConfiguration datasourceConfiguration) {
        Set<String> message = new HashSet<>();
        if (datasourceConfiguration != null) {
            boolean usingLocalhostUrl = false;

            if(!StringUtils.isEmpty(datasourceConfiguration.getUrl())) {
                usingLocalhostUrl = datasourceConfiguration.getUrl().contains("localhost");
            }
            else if(!CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                usingLocalhostUrl = datasourceConfiguration
                        .getEndpoints()
                        .stream()
                        .anyMatch(endpoint -> endpointContainsLocalhost(endpoint));
            }

            if(usingLocalhostUrl) {
                message.add("You may not be able to access your localhost if Appsmith is running inside a docker " +
                        "container or on the cloud. To enable access to your localhost you may use ngrok to expose " +
                        "your local endpoint to the internet. Please check out Appsmith's documentation to understand more" +
                        ".");
            }
        }

        return message;
    }

    public static Condition parseWhereClause(Map<String, Object> whereClause) {
        // Only proceed if this is a valid condition
        if (whereClause == null || !(whereClause.containsKey(KEY) || whereClause.containsKey(CHILDREN))) {
            return null;
        }
        Condition condition = new Condition();

        Object unparsedOperator = whereClause.getOrDefault(CONDITION, ConditionalOperator.EQ.name());

        ConditionalOperator operator;
        try {
            operator = ConditionalOperator.valueOf(((String) unparsedOperator).trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            // The operator could not be cast into a known type. Throw an exception
            log.error(e.getMessage());
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_UQI_WHERE_CONDITION_UNKNOWN, unparsedOperator);
        }

        condition.setOperator(operator);

        // For logical operators, we must walk all the children and add the same as values to this condition
        if (operator.equals(ConditionalOperator.AND) || operator.equals(ConditionalOperator.OR)) {
            List<Condition> children = new ArrayList<>();
            List<Map<String, Object>> conditionList = (List) whereClause.get(CHILDREN);
            for (Map<String, Object> unparsedCondition : conditionList) {
                Condition childCondition = parseWhereClause(unparsedCondition);
                if (childCondition != null) {
                    children.add(childCondition);
                }
            }
            if (!children.isEmpty()) {
                condition.setValue(children);
            }
        } else {
            // This is a comparison operator.
            String key = (String) whereClause.get(KEY);
            String value = (String) whereClause.get(VALUE);
            condition.setPath(key);
            condition.setValue(value);
        }

        return condition;
    }

    public static List<String> parseList(String arrayString) throws IOException {
        return objectMapper.readValue(arrayString, ArrayList.class);
    }

    public static <T> T getValueSafelyFromPropertyList(List<Property> properties, int index, Class<T> type,
                                                       T defaultValue) {
        if (CollectionUtils.isEmpty(properties) || index > properties.size() - 1 || properties.get(index) == null
                || properties.get(index).getValue() == null) {
            return defaultValue;
        }

        return (T) properties.get(index).getValue();
    }

    public static <T> T getValueSafelyFromPropertyList(List<Property> properties, int index, Class<T> type) {
        return getValueSafelyFromPropertyList(properties, index, type, null);
    }

    public static Object getValueSafelyFromPropertyList(List<Property> properties, int index) {
        return getValueSafelyFromPropertyList(properties, index, Object.class);
    }

    public static JSONObject parseStringIntoJSONObject(String body) throws JSONException {
        return new JSONObject(body);
    }

    public static void setValueSafelyInPropertyList(List<Property> properties, int index, Object value) throws AppsmithPluginException {
        if (properties == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server encountered an unexpected error: property list is null. Please reach out to " +
                            "our customer support to resolve this."
            );
        }

        if (index < 0 || index > properties.size() - 1) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server encountered an unexpected error: index value out or range: index: " + index +
                            ", property list size: " + properties.size() + ". Please reach out to our customer " +
                            "support to resolve this."
            );
        }

        properties.get(index).setValue(value);
    }

    public static String replaceMappedColumnInStringValue(Map<String, String> mappedColumns, Object propertyValue) {
        // In case the entire value finds a match in the mappedColumns, replace it
        if (mappedColumns.containsKey((String) propertyValue)) {
            return mappedColumns.get(propertyValue);
        }

        // If the column name is present inside a string (like json), then find all the words and replace
        // the column name with user one.
        Matcher matcher = WORD_PATTERN.matcher(propertyValue.toString());
        if (matcher.find()) {
            return matcher.replaceAll(key ->
                    mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group()));
        }

        return propertyValue.toString();
    }

    public static void safelyCloseSingleConnectionFromHikariCP(Connection connection, String logOnError) {
        if (connection != null) {
            try {
                // Return the connection back to the pool
                connection.close();
            } catch (SQLException e) {
                log.debug(logOnError, e);
            }
        }
    }
}
