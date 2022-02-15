package com.appsmith.external.helpers;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.io.IOException;
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
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.FieldName.CHILDREN;
import static com.appsmith.external.constants.FieldName.CONDITION;
import static com.appsmith.external.constants.FieldName.KEY;
import static com.appsmith.external.constants.FieldName.VALUE;

@Slf4j
public class PluginUtils {

    private static ObjectMapper objectMapper = new ObjectMapper();

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

    /**
     * Get value from `formData` map and also type cast it to the class of type `T` before returning the value. In
     * case the value is null, then the defaultValue is returned.
     *
     * @param formData
     * @param field : key path used to fetch value from formData
     * @param type : returned value is type casted to the type of this object before return.
     * @param defaultValue : this value is returned if the obtained value is null
     * @param <T> : type parameter to which the obtained value is cast to.
     * @return : obtained value (post type cast) if non-null, otherwise defaultValue
     */
    public static <T> T getValueSafelyFromFormData(Map<String, Object> formData, String field, Class<T> type,
                                                   T defaultValue) {
        Object formDataValue = getValueSafelyFromFormData(formData, field);
        return formDataValue != null ? (T) formDataValue : defaultValue;
    }

    /**
     * Get value from `formData` map and also type cast it to the class of type `T` before returning the value.
     *
     * @param formData
     * @param field : key path used to fetch value from formData
     * @param type : returned value is type casted to the type of this object before return.
     * @param <T> : type parameter to which the obtained value is cast to.
     * @return : obtained value (post type cast) if non-null, otherwise null.
     */
    public static <T> T getValueSafelyFromFormData(Map<String, Object> formData, String field, Class<T> type) {
        return (T) (getValueSafelyFromFormData(formData, field));
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

    public static Object getValueSafelyFromFormDataOrDefault(Map<String, Object> formData, String field, Object defaultValue) {

        Object value = getValueSafelyFromFormData(formData, field);

        if (value == null) {
            return defaultValue;
        }

        return value;
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


        if (operator != null) {

            condition.setOperator(operator);

            // For logical operators, we must walk all the children and add the same as values to this condition
            if (operator.equals(ConditionalOperator.AND) || operator.equals(ConditionalOperator.OR)) {
                List<Condition> children = new ArrayList<>();
                List<Map<String, Object>> conditionList = (List) whereClause.get(CHILDREN);
                for (Map<String, Object> unparsedCondition : conditionList) {
                    Condition childCondition = parseWhereClause(unparsedCondition);
                    children.add(childCondition);
                }
                condition.setValue(children);
            } else {
                // This is a comparison operator.
                String key = (String) whereClause.get(KEY);
                String value = (String) whereClause.get(VALUE);
                condition.setPath(key);
                condition.setValue(value);
            }
        }

        return condition;
    }

    public static List<String> parseList(String arrayString) throws IOException {
        return objectMapper.readValue(arrayString, ArrayList.class);
    }
}
