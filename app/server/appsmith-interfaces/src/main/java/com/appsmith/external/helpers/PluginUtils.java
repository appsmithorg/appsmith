package com.appsmith.external.helpers;

import com.appsmith.external.constants.ActionResultDataType;
import com.appsmith.external.models.ParsedDataType;
import com.fasterxml.jackson.core.type.TypeReference;
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
}
