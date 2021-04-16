package com.appsmith.external.helpers;

import com.appsmith.external.constants.ActionResultDataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ParsedDataType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.ActionConstants.KEY_LABEL;
import static com.appsmith.external.constants.ActionConstants.KEY_TYPE;
import static com.appsmith.external.constants.ActionConstants.KEY_VALUE;

public class PluginUtils {
    private static ObjectMapper objectMapper = new ObjectMapper();

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

    public static List<ParsedDataType> getActionResultDataTypes(String body) {

        if (body == null) {
            return new ArrayList<>();
        }

        if (body.isEmpty()) {
            return List.of(new ParsedDataType(ActionResultDataType.RAW));
        }

        List<ParsedDataType> dataTypes = new ArrayList<>();

        /*
         * - Check if the returned data is a valid table - i.e. an array of simple json objects.
         */
        try {
            objectMapper.readValue(body, new TypeReference<ArrayList<HashMap<String, String>>>() {});
            dataTypes.add(new ParsedDataType(ActionResultDataType.TABLE));
        } catch (IOException e) {
            /* Do nothing */
        }

        /*
         * - Check if the returned data is a valid json.
         */
        try {
            objectMapper.readTree(body);
            dataTypes.add(new ParsedDataType(ActionResultDataType.JSON));
        } catch (IOException e) {
            /* Do nothing */
        }

        /*
         * - All return data types can be categorized as raw by default.
         */
        dataTypes.add(new ParsedDataType(ActionResultDataType.RAW));

        return dataTypes;
    }

    public static void addToFieldsToBeProcessedForDataTypeDetection(List<Map<String, Object>> fieldsToBeProcessed,
                                                              String label, Object value) {
        fieldsToBeProcessed.add(new HashMap<>(){{
            put(KEY_LABEL, label);
            put(KEY_VALUE, value);
        }});
    }

    public static List<Map<String, Object>> getActionResultDataTypesForObjectsInList(List<Map<String, Object>> fieldsToBeProcessed) {
        List<Map<String, Object>> dataTypes = new ArrayList<>();

        dataTypes.addAll(
                fieldsToBeProcessed.stream()
                        .map(element -> new HashMap<String, Object>() {{
                            put(KEY_LABEL, element.get(KEY_LABEL));
                            put(KEY_VALUE, element.get(KEY_VALUE));
                            put(KEY_TYPE, element.get(KEY_VALUE) != null ?
                                    getActionResultDataTypes(element.get(KEY_VALUE).toString()) :
                                    new ArrayList<>());
                        }})
                        .collect(Collectors.toList())
        );

        return dataTypes;
    }
}
